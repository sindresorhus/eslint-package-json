import {
	findMember,
	getKey,
	checkConditionOrder,
	checkKeyConsistency,
	conditionOrderMessages,
	keyConsistencyMessages,
} from '../utils/index.js';

const MESSAGE_ID_RELATIVE_PATH = 'relativePath';
const MESSAGE_ID_SUBPATH_KEY = 'subpathKey';
const MESSAGE_ID_TYPES_EXTENSION = 'typesExtension';
const MESSAGE_ID_DUAL_TYPES = 'dualTypes';
const MESSAGE_ID_PATTERN = 'patternMismatch';

export const messages = {
	...conditionOrderMessages,
	...keyConsistencyMessages,
	[MESSAGE_ID_RELATIVE_PATH]: 'Export path `{{value}}` must start with `./`.',
	[MESSAGE_ID_SUBPATH_KEY]: 'Subpath key `{{key}}` must be `.` or start with `./`.',
	[MESSAGE_ID_TYPES_EXTENSION]: 'The `types` condition `{{value}}` must point at a declaration file ending in `.d.ts`, `.d.mts`, or `.d.cts`.',
	[MESSAGE_ID_DUAL_TYPES]: 'The `import` and `require` conditions both use `{{value}}` for types. A single `.d.ts` has the wrong module kind for one of them. Use `.d.mts`/`.d.cts`.',
	[MESSAGE_ID_PATTERN]: 'The target `{{value}}` must not contain `*` unless the subpath key `{{key}}` also contains `*`.',
};

// Matches the three valid TypeScript declaration-file extensions.
const typesExtensionPattern = /\.d\.[cm]?ts$/;

/**
Recurse a value node yielding every `String` leaf (a file target).
*/
function * iterateStringLeaves(node) {
	switch (node.type) {
		case 'String': {
			yield node;

			break;
		}

		case 'Object': {
			for (const member of node.members) {
				yield * iterateStringLeaves(member.value);
			}

			break;
		}

		case 'Array': {
			for (const element of node.elements) {
				yield * iterateStringLeaves(element.value);
			}

			break;
		}
	// No default
	}
}

function * checkPatternTarget(node, key) {
	if (key.includes('*')) {
		return;
	}

	for (const leaf of iterateStringLeaves(node)) {
		if (leaf.value !== '' && leaf.value.includes('*')) {
			yield {
				node: leaf,
				messageId: MESSAGE_ID_PATTERN,
				data: {key, value: leaf.value},
			};
		}
	}
}

/**
Get a condition's own nested `types` value node, or `undefined` if the condition is not an object with a String `types` member.
*/
function getOwnTypes(objectNode, conditionKey) {
	const condition = findMember(objectNode, conditionKey);

	if (condition?.value.type !== 'Object') {
		return undefined;
	}

	const types = findMember(condition.value, 'types');

	return types?.value.type === 'String' ? types.value : undefined;
}

/**
Check for declaration files that are shared by both module kinds in a dual `import`/`require` export.
*/
function * checkDualTypes(objectNode) {
	const types = findMember(objectNode, 'types');
	const hasImport = Boolean(findMember(objectNode, 'import'));
	const hasRequire = Boolean(findMember(objectNode, 'require'));
	const importTypes = getOwnTypes(objectNode, 'import');
	const requireTypes = getOwnTypes(objectNode, 'require');

	if (types?.value.type === 'String' && hasImport && hasRequire && types.value.value.endsWith('.d.ts')) {
		yield {
			node: types.value,
			messageId: MESSAGE_ID_DUAL_TYPES,
			data: {value: types.value.value},
		};
	}

	if (importTypes && requireTypes && importTypes.value === requireTypes.value && importTypes.value.endsWith('.d.ts')) {
		yield {
			node: requireTypes,
			messageId: MESSAGE_ID_DUAL_TYPES,
			data: {value: requireTypes.value},
		};
	}
}

/**
Recursively check all object nodes within the exports tree, yielding problems.
*/
function * checkExportsNode(node, sourceCode) {
	switch (node.type) {
		case 'Object': {
			yield * checkObject(node, sourceCode);

			break;
		}

		case 'Array': {
			for (const element of node.elements) {
				yield * checkExportsNode(element.value, sourceCode);
			}

			break;
		}

		case 'String': {
			const {value} = node;

			// Already valid, or an absolute path that is invalid for a different reason we do not autofix (prepending `./` would corrupt it).
			if (value === '' || value.startsWith('./') || value.startsWith('/')) {
				break;
			}

			const problem = {
				node,
				messageId: MESSAGE_ID_RELATIVE_PATH,
				data: {value},
			};

			// A `../` path escapes the package, so prepending `./` would not make it valid. Report it without the misleading autofix.
			if (!value.startsWith('../')) {
				problem.fix = fixer => fixer.replaceText(node, JSON.stringify('./' + value));
			}

			yield problem;

			break;
		}
	// No default
	}
}

/**
Check a single object node for condition ordering and subpath/condition key validity, then recurse into member values.
*/
function * checkObject(objectNode, sourceCode) {
	yield * checkConditionOrder(sourceCode, objectNode);
	yield * checkKeyConsistency(objectNode, '.');
	yield * checkDualTypes(objectNode);

	for (const member of objectNode.members) {
		const key = getKey(member);

		// A subpath key (one that starts with `.`) must be exactly `.` or start with `./`.
		if (key.startsWith('.') && key !== '.' && !key.startsWith('./')) {
			yield {
				node: member.name,
				messageId: MESSAGE_ID_SUBPATH_KEY,
				data: {key},
			};
		}

		// A target pattern only has meaning when the subpath key is also a pattern.
		if (key.startsWith('.')) {
			yield * checkPatternTarget(member.value, key);
		}

		// A `types` condition must point at a declaration file.
		if (key === 'types' && member.value.type === 'String' && member.value.value !== '' && !typesExtensionPattern.test(member.value.value)) {
			yield {
				node: member.value,
				messageId: MESSAGE_ID_TYPES_EXTENSION,
				data: {value: member.value.value},
			};
		}

		yield * checkExportsNode(member.value, sourceCode);
	}
}

function isTopLevelConditionMap(node) {
	return node.type === 'Object' && node.members.every(member => !getKey(member).startsWith('.'));
}

export function * check(root, context) {
	const exportsMember = findMember(root, 'exports');

	if (!exportsMember) {
		return;
	}

	const {sourceCode} = context;

	if (exportsMember.value.type !== 'Object' || isTopLevelConditionMap(exportsMember.value)) {
		yield * checkPatternTarget(exportsMember.value, '.');
	}

	for (const problem of checkExportsNode(exportsMember.value, sourceCode)) {
		yield problem;
	}
}
