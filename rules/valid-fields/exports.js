import {
	findMember,
	getKey,
	checkKeyConsistency,
	keyConsistencyMessages,
	hasInvalidPackageTargetSegment,
	isArrayIndexKey,
} from '../utils/index.js';

const MESSAGE_ID_RELATIVE_PATH = 'relativePath';
const MESSAGE_ID_SUBPATH_KEY = 'subpathKey';
const MESSAGE_ID_INVALID_SUBPATH = 'invalidSubpath';
const MESSAGE_ID_CONDITION_KEY = 'conditionKey';
const MESSAGE_ID_PATTERN = 'patternMismatch';
const MESSAGE_ID_TARGET_TYPE = 'targetType';
const MESSAGE_ID_INVALID_TARGET = 'invalidTarget';
const MESSAGE_ID_ROOT_TYPE = 'rootType';

export const messages = {
	...keyConsistencyMessages,
	[MESSAGE_ID_RELATIVE_PATH]: 'Export target `{{value}}` must be a package-relative path starting with `./`.',
	[MESSAGE_ID_SUBPATH_KEY]: 'Subpath key `{{key}}` must be `.` or start with `./`.',
	[MESSAGE_ID_INVALID_SUBPATH]: 'Subpath key `{{key}}` contains a path segment that Node does not allow.',
	[MESSAGE_ID_CONDITION_KEY]: 'Condition key `{{key}}` must not be an array index.',
	[MESSAGE_ID_INVALID_TARGET]: 'Export target `{{value}}` contains a path segment that Node does not allow.',
	[MESSAGE_ID_PATTERN]: 'The target `{{value}}` must not contain `*` unless the subpath key `{{key}}` also contains `*`.',
	[MESSAGE_ID_TARGET_TYPE]: 'An `exports` target must be a string, `null`, an object, or an array.',
	[MESSAGE_ID_ROOT_TYPE]: 'The top-level `exports` field must be a string, an object, or an array.',
};

/**
Recursively yields every `String` leaf (a file target) in a value node.
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

		default: {
			break;
		}
	}
}

function * checkPatternTarget(node, key) {
	if (key.includes('*')) {
		return;
	}

	for (const leaf of iterateStringLeaves(node)) {
		if (typeof leaf.value === 'string' && leaf.value !== '' && leaf.value.includes('*')) {
			yield {
				node: leaf,
				messageId: MESSAGE_ID_PATTERN,
				data: {key, value: leaf.value},
			};
		}
	}
}

/**
Recursively check all object nodes within the exports tree, yielding problems.
*/
function * checkExportsNode(node) {
	switch (node.type) {
		case 'Object': {
			yield * checkObject(node);

			break;
		}

		case 'Array': {
			for (const element of node.elements) {
				yield * checkExportsNode(element.value);
			}

			break;
		}

		case 'String': {
			const {value} = node;

			if (value.startsWith('./')) {
				if (hasInvalidPackageTargetSegment(value)) {
					yield {
						node,
						messageId: MESSAGE_ID_INVALID_TARGET,
						data: {value},
					};
				}

				break;
			}

			const problem = {
				node,
				messageId: MESSAGE_ID_RELATIVE_PATH,
				data: {value},
			};

			// A `../` path escapes the package, so prepending `./` would not make it valid. Report it without the misleading autofix.
			if (value !== '' && !value.startsWith('../') && !value.startsWith('/') && !value.includes('://')) {
				problem.fix = fixer => fixer.replaceText(node, JSON.stringify('./' + value));
			}

			yield problem;

			break;
		}

		case 'Null': {
			break;
		}

		default: {
			yield {
				node,
				messageId: MESSAGE_ID_TARGET_TYPE,
			};
		}
	}
}

/**
Check a single object node for subpath/condition key validity, then recurse into member values.
*/
function * checkObject(objectNode) {
	yield * checkKeyConsistency(objectNode, '.');

	for (const member of objectNode.members) {
		const key = getKey(member);

		if (isArrayIndexKey(key)) {
			yield {
				node: member.name,
				messageId: MESSAGE_ID_CONDITION_KEY,
				data: {key},
			};
		}

		// A subpath key (one that starts with `.`) must be exactly `.` or start with `./`.
		if (key.startsWith('.') && key !== '.' && !key.startsWith('./')) {
			yield {
				node: member.name,
				messageId: MESSAGE_ID_SUBPATH_KEY,
				data: {key},
			};
		}

		if (key.startsWith('./') && hasInvalidPackageTargetSegment(key)) {
			yield {
				node: member.name,
				messageId: MESSAGE_ID_INVALID_SUBPATH,
				data: {key},
			};
		}

		// A target pattern only has meaning when the subpath key is also a pattern.
		if (key.startsWith('.')) {
			yield * checkPatternTarget(member.value, key);
		}

		yield * checkExportsNode(member.value);
	}
}

function isTopLevelConditionMap(node) {
	return node.type === 'Object' && node.members.every(member => !getKey(member).startsWith('.'));
}

export function * check(root) {
	const exportsMember = findMember(root, 'exports');

	if (!exportsMember) {
		return;
	}

	if (exportsMember.value.type === 'Null') {
		yield {
			node: exportsMember.value,
			messageId: MESSAGE_ID_ROOT_TYPE,
		};
		return;
	}

	if (exportsMember.value.type !== 'Object' || isTopLevelConditionMap(exportsMember.value)) {
		yield * checkPatternTarget(exportsMember.value, '.');
	}

	for (const problem of checkExportsNode(exportsMember.value)) {
		yield problem;
	}
}
