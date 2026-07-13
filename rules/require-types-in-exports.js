import {getRootObject, findMember, getKey} from './utils/index.js';

const MESSAGE_ID_MISSING = 'missing';
const MESSAGE_ID_TYPES_FIRST = 'typesFirst';
const MESSAGE_ID_TYPES_EXTENSION = 'typesExtension';
const MESSAGE_ID_MODULE_FORMAT = 'moduleFormat';
const MESSAGE_ID_TYPES_VALUE = 'typesValue';

const messages = {
	[MESSAGE_ID_MISSING]: 'Exported JavaScript target `{{value}}` has no corresponding `types` condition.',
	[MESSAGE_ID_TYPES_FIRST]: 'Type conditions must come before runtime conditions in a conditions object.',
	[MESSAGE_ID_TYPES_EXTENSION]: 'The `types` condition `{{value}}` must point at a declaration file ending in `.d.ts`, `.d.mts`, or `.d.cts`.',
	[MESSAGE_ID_MODULE_FORMAT]: 'Type declaration `{{types}}` uses {{actual}} format but its JavaScript target uses {{expected}} format.',
	[MESSAGE_ID_TYPES_VALUE]: 'The `types` condition must point to a declaration file.',
};

const declarationPathPattern = /\.d\.(?:ts|mts|cts)$/u;
const javascriptPathPattern = /\.(?:c|m)?js$/u;

function isTypesCondition(key) {
	return key === 'types' || key.startsWith('types@');
}

function isRuntimeTarget(value) {
	return javascriptPathPattern.test(value);
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

function hasObjectTypesCoverage(node, runtimeNode, runtimeKey) {
	if (runtimeKey) {
		const matchingMember = node.members.find(member => getKey(member) === runtimeKey);

		if (matchingMember) {
			const hasMatchingTypes = hasTypesCoverage(matchingMember.value, runtimeNode);

			if (hasMatchingTypes || (matchingMember.value.type !== 'Object' && matchingMember.value.type !== 'Array')) {
				return hasMatchingTypes;
			}
		}
	}

	for (const member of node.members) {
		const key = getKey(member);

		if ((isTypesCondition(key) || key === 'default') && hasTypesCoverage(member.value, runtimeNode, runtimeKey)) {
			return true;
		}
	}

	if (runtimeNode.type !== 'Object') {
		return false;
	}

	const runtimeMembers = runtimeNode.members.filter(member => !isTypesCondition(getKey(member)));
	return runtimeMembers.length > 0 && runtimeMembers.every(member => hasTypesCoverage(node, member.value, getKey(member)));
}

function hasTypesCoverage(node, runtimeNode, runtimeKey) {
	switch (node.type) {
		case 'String': {
			return node.value !== '';
		}

		case 'Object': {
			return hasObjectTypesCoverage(node, runtimeNode, runtimeKey);
		}

		case 'Array': {
			return node.elements.some(element => hasTypesCoverage(element.value, runtimeNode, runtimeKey));
		}

		default: {
			return false;
		}
	}
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

function * iterateUncoveredFallbackPairs(fallbackNode, matchingNode, runtimeNode, runtimeKey) {
	if (runtimeKey && fallbackNode.type === 'Object') {
		const matchingMember = fallbackNode.members.find(member => getKey(member) === runtimeKey);

		if (matchingMember) {
			yield * iterateUncoveredFallbackPairs(matchingMember.value, matchingNode, runtimeNode);

			const hasMatchingTypes = hasTypesCoverage(matchingMember.value, runtimeNode);
			const canFallThrough = matchingMember.value.type === 'Object' || matchingMember.value.type === 'Array';

			if (hasMatchingTypes || !canFallThrough) {
				return;
			}
		}

		const fallbackMember = fallbackNode.members.find(member => isTypesCondition(getKey(member)) || getKey(member) === 'default');

		if (fallbackMember && fallbackMember !== matchingMember) {
			yield * iterateUncoveredFallbackPairs(fallbackMember.value, matchingNode, runtimeNode, runtimeKey);
			return;
		}

		if (matchingMember) {
			return;
		}
	}

	if (runtimeNode.type !== 'Object') {
		yield * iterateTypeRuntimePairs(fallbackNode, runtimeNode, runtimeKey);
		return;
	}

	for (const runtimeMember of runtimeNode.members) {
		const key = getKey(runtimeMember);

		if (!isTypesCondition(key) && !hasTypesCoverage(matchingNode, runtimeMember.value, key)) {
			yield * iterateTypeRuntimePairs(fallbackNode, runtimeMember.value, key);
		}
	}
}

function * iterateTypeRuntimePairsWithoutKey(typeNode, runtimeNode) {
	const typesMembers = typeNode.members.filter(member => isTypesCondition(getKey(member)));
	const defaultMember = typeNode.members.find(member => getKey(member) === 'default');
	const hasUnversionedTypes = typesMembers.some(member => getKey(member) === 'types');

	for (const typesMember of typesMembers) {
		yield * iterateTypeRuntimePairs(typesMember.value, runtimeNode);
	}

	if (typesMembers.length > 0) {
		if (!hasUnversionedTypes && defaultMember) {
			yield * iterateTypeRuntimePairs(defaultMember.value, runtimeNode);
		}

		return;
	}

	if (runtimeNode.type === 'Object') {
		for (const runtimeMember of runtimeNode.members) {
			if (!isTypesCondition(getKey(runtimeMember))) {
				yield * iterateTypeRuntimePairs(typeNode, runtimeMember.value, getKey(runtimeMember));
			}
		}
	} else if (defaultMember) {
		yield * iterateTypeRuntimePairs(defaultMember.value, runtimeNode);
	}
}

function * iterateTypeRuntimePairs(typeNode, runtimeNode, runtimeKey) {
	switch (typeNode.type) {
		case 'String': {
			for (const runtimeTarget of iterateRuntimeStringLeaves(runtimeNode)) {
				yield [typeNode, runtimeTarget];
			}

			break;
		}

		case 'Object': {
			const fallbackMember = typeNode.members.find(member => isTypesCondition(getKey(member)) || getKey(member) === 'default');

			if (runtimeKey) {
				const matchingMember = typeNode.members.find(member => getKey(member) === runtimeKey);

				if (matchingMember) {
					for (const pair of iterateTypeRuntimePairs(matchingMember.value, runtimeNode)) {
						yield pair;
					}

					const hasMatchingTypes = hasTypesCoverage(matchingMember.value, runtimeNode);
					const canFallThrough = matchingMember.value.type === 'Object' || matchingMember.value.type === 'Array';

					if (hasMatchingTypes || !canFallThrough) {
						return;
					}

					if (fallbackMember) {
						yield * iterateUncoveredFallbackPairs(fallbackMember.value, matchingMember.value, runtimeNode, runtimeKey);
					}

					return;
				}

				if (fallbackMember) {
					yield * iterateTypeRuntimePairs(fallbackMember.value, runtimeNode, runtimeKey);
				}

				return;
			}

			yield * iterateTypeRuntimePairsWithoutKey(typeNode, runtimeNode);

			break;
		}

		case 'Array': {
			for (const element of typeNode.elements) {
				yield * iterateTypeRuntimePairs(element.value, runtimeNode, runtimeKey);
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

function getModuleFormatProblem(typeTarget, runtimeTarget, packageType, reportedFormats) {
	const actual = getDeclarationFormat(typeTarget.value, packageType);

	if (!actual) {
		return;
	}

	const expected = getRuntimeFormat(runtimeTarget.value, packageType);

	if (!expected || actual === expected) {
		return;
	}

	const key = `${typeTarget.value}:${runtimeTarget.value}`;

	if (reportedFormats.has(key)) {
		return;
	}

	reportedFormats.add(key);
	return {
		node: typeTarget,
		messageId: MESSAGE_ID_MODULE_FORMAT,
		data: {
			types: typeTarget.value,
			actual,
			expected,
		},
	};
}

function * checkTypesObject(objectNode, packageType) {
	const typesMembers = objectNode.members.filter(member => isTypesCondition(getKey(member)));

	for (const member of typesMembers) {
		const index = objectNode.members.indexOf(member);
		const typeTargets = [...iterateStringLeaves(member.value)];

		if (objectNode.members.slice(0, index).some(member => !isTypesCondition(getKey(member)))) {
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

	const reportedFormats = new Set();

	for (const member of typesMembers) {
		for (const [typeTarget, runtimeTarget] of iterateTypeRuntimePairs(member.value, objectNode)) {
			const problem = getModuleFormatProblem(typeTarget, runtimeTarget, packageType, reportedFormats);

			if (problem) {
				yield problem;
			}
		}
	}
}

function * checkNode(node, packageType, hasInheritedTypes = false) {
	switch (node.type) {
		case 'Object': {
			const typesMembers = node.members.filter(member => isTypesCondition(getKey(member)));

			if (typesMembers.length > 0) {
				yield * checkTypesObject(node, packageType);
			}

			for (const member of node.members) {
				if (isTypesCondition(getKey(member))) {
					continue;
				}

				// A versioned condition may fall through to a complete unversioned `types` condition when its nested conditions do not match.
				const hasCompleteFallback = typesMembers.some(typesMember => getKey(typesMember) === 'types' && hasTypesCoverage(typesMember.value, member.value, getKey(member)));
				const hasOwnTypes = typesMembers.length > 0 && (hasCompleteFallback || typesMembers.every(typesMember => hasTypesCoverage(typesMember.value, member.value, getKey(member))));
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
