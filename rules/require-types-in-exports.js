import {getRootObject, findMember, getKey} from './utils/index.js';

const MESSAGE_ID_MISSING = 'missing';
const MESSAGE_ID_TYPES_FIRST = 'typesFirst';
const MESSAGE_ID_TYPES_EXTENSION = 'typesExtension';
const MESSAGE_ID_MODULE_FORMAT = 'moduleFormat';
const MESSAGE_ID_TYPES_VALUE = 'typesValue';

const messages = {
	[MESSAGE_ID_MISSING]: 'Exported JavaScript target `{{value}}` has no corresponding `types` condition.',
	[MESSAGE_ID_TYPES_FIRST]: 'The `types` condition must be first in a conditions object.',
	[MESSAGE_ID_TYPES_EXTENSION]: 'The `types` condition `{{value}}` must point at a declaration file ending in `.d.ts`, `.d.mts`, or `.d.cts`.',
	[MESSAGE_ID_MODULE_FORMAT]: 'Type declaration `{{types}}` uses {{actual}} format but its JavaScript target uses {{expected}} format.',
	[MESSAGE_ID_TYPES_VALUE]: 'The `types` condition must point to a declaration file.',
};

const declarationPathPattern = /\.d\.(?:ts|mts|cts)$/u;

function isTypesCondition(key) {
	return key === 'types' || key.startsWith('types@');
}

function isRuntimeTarget(value) {
	return !declarationPathPattern.test(value);
}

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

function hasNonEmptyStringLeaf(node) {
	for (const leaf of iterateStringLeaves(node)) {
		if (leaf.value !== '') {
			return true;
		}
	}

	return false;
}

function * iterateRuntimeStringLeaves(node) {
	switch (node.type) {
		case 'String': {
			if (isRuntimeTarget(node.value)) {
				yield node;
			}

			break;
		}

		case 'Object': {
			for (const member of node.members) {
				if (isTypesCondition(getKey(member))) {
					continue;
				}

				yield * iterateRuntimeStringLeaves(member.value);
			}

			break;
		}

		case 'Array': {
			for (const element of node.elements) {
				yield * iterateRuntimeStringLeaves(element.value);
			}

			break;
		}
	// No default
	}
}

function getPackageType(root) {
	const type = findMember(root, 'type');

	if (type?.value.type !== 'String') {
		return 'commonjs';
	}

	if (type.value.value === 'module') {
		return 'module';
	}

	if (type.value.value === 'commonjs') {
		return 'commonjs';
	}

	return undefined;
}

function getRuntimeFormat(value, packageType) {
	if (value.endsWith('.mjs')) {
		return 'ES module';
	}

	if (value.endsWith('.cjs')) {
		return 'CommonJS';
	}

	if (value.endsWith('.js')) {
		return packageType === 'module' ? 'ES module' : 'CommonJS';
	}

	return undefined;
}

function getDeclarationFormat(value, packageType) {
	if (value.endsWith('.d.mts')) {
		return 'ES module';
	}

	if (value.endsWith('.d.cts')) {
		return 'CommonJS';
	}

	if (value.endsWith('.d.ts')) {
		return packageType === 'module' ? 'ES module' : 'CommonJS';
	}

	return undefined;
}

function * checkTypesObject(objectNode, packageType) {
	const typesMembers = objectNode.members.filter(member => isTypesCondition(getKey(member)));

	for (const member of typesMembers) {
		const index = objectNode.members.indexOf(member);
		const typeTargets = [...iterateStringLeaves(member.value)];

		if (index > 0) {
			yield {
				node: member.name,
				messageId: MESSAGE_ID_TYPES_FIRST,
			};
		}

		if (typeTargets.length === 0 || typeTargets.some(target => target.value === '')) {
			yield {
				node: member.value,
				messageId: MESSAGE_ID_TYPES_VALUE,
			};
		}

		for (const leaf of typeTargets) {
			if (leaf.value !== '' && !declarationPathPattern.test(leaf.value)) {
				yield {
					node: leaf,
					messageId: MESSAGE_ID_TYPES_EXTENSION,
					data: {value: leaf.value},
				};
			}
		}
	}

	const typeTargets = typesMembers.flatMap(member => [...iterateStringLeaves(member.value)]);
	const runtimeTargets = [...iterateRuntimeStringLeaves(objectNode)];
	const reportedFormats = new Set();

	for (const typeTarget of typeTargets) {
		const actual = getDeclarationFormat(typeTarget.value, packageType);

		if (!actual) {
			continue;
		}

		for (const runtimeTarget of runtimeTargets) {
			const expected = getRuntimeFormat(runtimeTarget.value, packageType);

			if (expected && actual !== expected) {
				const key = `${typeTarget.value}:${runtimeTarget.value}`;

				if (!reportedFormats.has(key)) {
					reportedFormats.add(key);
					yield {
						node: typeTarget,
						messageId: MESSAGE_ID_MODULE_FORMAT,
						data: {
							types: typeTarget.value,
							actual,
							expected,
						},
					};
				}
			}
		}
	}
}

function * checkNode(node, packageType, hasInheritedTypes = false) {
	switch (node.type) {
		case 'Object': {
			const hasOwnTypes = node.members.some(member => isTypesCondition(getKey(member)) && hasNonEmptyStringLeaf(member.value));
			const hasTypesCondition = node.members.some(member => isTypesCondition(getKey(member)));

			if (hasTypesCondition) {
				yield * checkTypesObject(node, packageType);
			}

			for (const member of node.members) {
				if (isTypesCondition(getKey(member))) {
					continue;
				}

				yield * checkNode(member.value, packageType, hasInheritedTypes || hasOwnTypes);
			}

			break;
		}

		case 'Array': {
			for (const element of node.elements) {
				yield * checkNode(element.value, packageType, hasInheritedTypes);
			}

			break;
		}

		case 'String': {
			if (hasInheritedTypes || !isRuntimeTarget(node.value)) {
				break;
			}

			yield {
				node,
				messageId: MESSAGE_ID_MISSING,
				data: {value: node.value},
			};

			break;
		}
	// No default
	}
}

function hasTypesCondition(node) {
	if (node.type === 'Object') {
		return node.members.some(member => isTypesCondition(getKey(member)) || hasTypesCondition(member.value));
	}

	if (node.type === 'Array') {
		return node.elements.some(element => hasTypesCondition(element.value));
	}

	return false;
}

/** @param {import('eslint').Rule.RuleContext} context */
const create = context => ({
	Document(node) {
		const root = getRootObject(node);

		if (!root) {
			return;
		}

		const exportsMember = findMember(root, 'exports');

		if (!exportsMember) {
			return;
		}

		const isTopLevelTypes = [findMember(root, 'types'), findMember(root, 'typings')]
			.some(member => member?.value.type === 'String');

		if (!isTopLevelTypes && !hasTypesCondition(exportsMember.value)) {
			return;
		}

		for (const problem of checkNode(exportsMember.value, getPackageType(root))) {
			context.report(problem);
		}
	},
});

/** @type {import('eslint').Rule.RuleModule} */
const config = {
	create,
	meta: {
		type: 'suggestion',
		docs: {
			description: 'Require correctly ordered and module-compatible types in `exports`.',
			recommended: true,
		},
		schema: [],
		messages,
		languages: ['json/json'],
	},
};

export default config;
