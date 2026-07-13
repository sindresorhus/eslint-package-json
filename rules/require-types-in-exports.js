import {getRootObject, findMember, getKey} from './utils/index.js';

const MESSAGE_ID_MISSING = 'missing';
const MESSAGE_ID_TYPES_FIRST = 'typesFirst';
const MESSAGE_ID_TYPES_EXTENSION = 'typesExtension';
const MESSAGE_ID_MODULE_FORMAT = 'moduleFormat';
const MESSAGE_ID_TYPES_VALUE = 'typesValue';
const MESSAGE_ID_TYPES_VERSION = 'typesVersion';

const messages = {
	[MESSAGE_ID_MISSING]: 'Exported JavaScript target `{{value}}` has no corresponding `types` condition.',
	[MESSAGE_ID_TYPES_FIRST]: 'Type conditions must come before runtime conditions in a conditions object.',
	[MESSAGE_ID_TYPES_EXTENSION]: 'The `types` condition `{{value}}` must point at a declaration file ending in `.d.ts`, `.d.mts`, or `.d.cts`.',
	[MESSAGE_ID_MODULE_FORMAT]: 'Type declaration `{{types}}` uses {{actual}} format but its JavaScript target uses {{expected}} format.',
	[MESSAGE_ID_TYPES_VALUE]: 'The `types` condition must point to a declaration file.',
	[MESSAGE_ID_TYPES_VERSION]: 'Versioned type condition `{{key}}` must use TypeScript-compatible semver syntax.',
};

const declarationPathPattern = /\.d\.(?:ts|mts|cts)$/u;
const javascriptPathPattern = /\.(?:c|m)?js$/u;
const typesVersionPartialPattern = /^(?:[*0Xx]|[1-9]\d*)(?:\.(?:[*0Xx]|[1-9]\d*)(?:\.(?:[*0Xx]|[1-9]\d*)(?:-(?<prerelease>[\d\-.A-Za-z]+))?(?:\+(?<build>[\d\-.A-Za-z]+))?)?)?$/u;
const typesVersionPrereleasePattern = /^(?:0|[1-9]\d*|[-A-Za-z][\d\-A-Za-z]*)(?:\.(?:0|[1-9]\d*|[-A-Za-z][\d\-A-Za-z]*))*$/u;
const typesVersionBuildPattern = /^[\d\-A-Za-z]+(?:\.[\d\-A-Za-z]+)*$/u;
const typesVersionComparatorPattern = /^(?:<=|>=|[<=>^~])?([\d*+\-.A-Za-z]+)$/u;
const typesVersionHyphenPattern = /^([\d*+\-.A-Za-z]+)\s+-\s+([\d*+\-.A-Za-z]+)$/u;

function isTypesConditionKey(key) {
	return key === 'types' || key.startsWith('types@');
}

function isValidTypesVersionPartial(value) {
	const match = typesVersionPartialPattern.exec(value);

	if (!match) {
		return false;
	}

	const {prerelease, build} = match.groups;
	return (!prerelease || typesVersionPrereleasePattern.test(prerelease))
		&& (!build || typesVersionBuildPattern.test(build));
}

function isValidTypesVersionRange(range) {
	for (const rawAlternative of range.trim().split('||')) {
		if (rawAlternative === '') {
			continue;
		}

		const alternative = rawAlternative.trim();

		if (alternative === '') {
			return false;
		}

		const hyphenMatch = typesVersionHyphenPattern.exec(alternative);

		if (hyphenMatch) {
			if (!isValidTypesVersionPartial(hyphenMatch[1]) || !isValidTypesVersionPartial(hyphenMatch[2])) {
				return false;
			}

			continue;
		}

		for (const comparator of alternative.split(/\s+/u)) {
			const match = typesVersionComparatorPattern.exec(comparator);

			if (!match || !isValidTypesVersionPartial(match[1])) {
				return false;
			}
		}
	}

	return true;
}

function isTypesCondition(key) {
	if (key === 'types') {
		return true;
	}

	if (!key.startsWith('types@')) {
		return false;
	}

	const range = key.slice('types@'.length);
	return isValidTypesVersionRange(range);
}

function isRuntimeTarget(value) {
	return javascriptPathPattern.test(value);
}

function getFirstTarget(node) {
	while (node?.type === 'Array') {
		node = node.elements[0]?.value;
	}

	return node;
}

function canTypeTargetFallThrough(node) {
	const effectiveNode = getFirstTarget(node);

	if (!effectiveNode) {
		return true;
	}

	if (effectiveNode.type !== 'Object') {
		return false;
	}

	const defaultMember = effectiveNode.members.find(member => getKey(member) === 'default');
	return !defaultMember || canTypeTargetFallThrough(defaultMember.value);
}

function getTargetWithFallback(node, fallbackMember) {
	if (
		node.type !== 'Object'
		|| !fallbackMember
		|| node.members.some(member => getKey(member) === 'default')
	) {
		return node;
	}

	return {
		...node,
		members: [...node.members, fallbackMember],
	};
}

function getNextFallbackMember(objectNode, member) {
	const index = objectNode.members.indexOf(member);
	return objectNode.members.slice(index + 1).find(candidate => isTypesCondition(getKey(candidate)) || getKey(candidate) === 'default');
}

function getFallbackTarget(objectNode, member) {
	let nextMember = getNextFallbackMember(objectNode, member);

	while (!getFirstTarget(member.value) && nextMember) {
		member = nextMember;
		nextMember = getNextFallbackMember(objectNode, member);
	}

	return getTargetWithFallback(member.value, nextMember);
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
			const firstTarget = getFirstTarget(node);

			if (firstTarget) {
				yield * iterateStringLeaves(firstTarget);
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

			if (hasMatchingTypes || !canTypeTargetFallThrough(matchingMember.value)) {
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
			const firstTarget = getFirstTarget(node);
			return Boolean(firstTarget && hasTypesCoverage(firstTarget, runtimeNode, runtimeKey));
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
			const firstTarget = getFirstTarget(node);

			if (firstTarget) {
				yield * iterateRuntimeStringLeaves(firstTarget);
			}

			break;
		}
	// No default
	}
}

function * iterateUncoveredFallbackPairs(fallbackNode, matchingNode, runtimeNode, runtimeKey) {
	if (runtimeKey && fallbackNode.type === 'Object') {
		const matchingMember = fallbackNode.members.find(member => getKey(member) === runtimeKey);

		if (!matchingMember && runtimeNode.type === 'Object') {
			yield * iterateUncoveredFallbackPairs(fallbackNode, matchingNode, runtimeNode);
			return;
		}

		if (matchingMember) {
			yield * iterateUncoveredFallbackPairs(matchingMember.value, matchingNode, runtimeNode);

			const hasMatchingTypes = hasTypesCoverage(matchingMember.value, runtimeNode);
			const canFallThrough = canTypeTargetFallThrough(matchingMember.value);

			if (hasMatchingTypes || !canFallThrough) {
				return;
			}
		}

		if (!matchingMember && fallbackNode.members.some(member => isTypesCondition(getKey(member)))) {
			yield * iterateTypeRuntimePairsWithoutKey(fallbackNode, runtimeNode);
			return;
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

		if (isTypesCondition(key) || hasTypesCoverage(matchingNode, runtimeMember.value, key)) {
			continue;
		}

		const hasMatchingFallback = fallbackNode.type === 'Object' && fallbackNode.members.some(member => getKey(member) === key);

		if (!hasMatchingFallback && runtimeMember.value.type === 'Object') {
			yield * iterateUncoveredFallbackPairs(fallbackNode, matchingNode, runtimeMember.value);
		} else {
			yield * iterateTypeRuntimePairs(fallbackNode, runtimeMember.value, key);
		}
	}
}

function * iterateTypeRuntimePairsWithoutKey(typeNode, runtimeNode) {
	const typesMembers = typeNode.members.filter(member => isTypesCondition(getKey(member)));
	const defaultMember = typeNode.members.find(member => getKey(member) === 'default');
	const unversionedTypesMember = typesMembers.find(member => getKey(member) === 'types');
	const hasUnversionedTypes = Boolean(unversionedTypesMember && hasTypesCoverage(unversionedTypesMember.value, runtimeNode));

	for (const typesMember of typesMembers) {
		yield * iterateTypeRuntimePairs(typesMember.value, runtimeNode);
	}

	if (typesMembers.length > 0) {
		if (defaultMember && !hasUnversionedTypes) {
			if (unversionedTypesMember) {
				yield * iterateUncoveredFallbackPairs(defaultMember.value, unversionedTypesMember.value, runtimeNode);
			} else {
				yield * iterateTypeRuntimePairs(defaultMember.value, runtimeNode);
			}
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
					const matchingTarget = getTargetWithFallback(matchingMember.value, fallbackMember === matchingMember ? undefined : fallbackMember);

					for (const pair of iterateTypeRuntimePairs(matchingTarget, runtimeNode)) {
						yield pair;
					}

					const hasMatchingTypes = hasTypesCoverage(matchingTarget, runtimeNode);
					const canFallThrough = canTypeTargetFallThrough(matchingTarget);

					if (matchingTarget !== matchingMember.value || hasMatchingTypes || !canFallThrough) {
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
			const firstTarget = getFirstTarget(typeNode);

			if (firstTarget) {
				yield * iterateTypeRuntimePairs(firstTarget, runtimeNode, runtimeKey);
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

	let expectedFormats = reportedFormats.get(typeTarget);

	if (expectedFormats?.has(expected)) {
		return;
	}

	if (!expectedFormats) {
		expectedFormats = new Set();
		reportedFormats.set(typeTarget, expectedFormats);
	}

	expectedFormats.add(expected);
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

function * checkTypesMembers(objectNode) {
	const typesMembers = [];

	for (const member of objectNode.members) {
		const key = getKey(member);

		if (!isTypesConditionKey(key)) {
			continue;
		}

		if (!isTypesCondition(key)) {
			yield {
				node: member.name,
				messageId: MESSAGE_ID_TYPES_VERSION,
				data: {key},
			};
			continue;
		}

		typesMembers.push(member);
	}

	for (const member of typesMembers) {
		const index = objectNode.members.indexOf(member);
		const effectiveTypeNode = getFirstTarget(member.value);
		const typeTargets = effectiveTypeNode ? [...iterateStringLeaves(effectiveTypeNode)] : [];

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

	return typesMembers;
}

function * checkNestedTypes(node) {
	node = getFirstTarget(node);

	if (node?.type !== 'Object') {
		return;
	}

	if (node.members.some(member => isTypesConditionKey(getKey(member)))) {
		yield * checkTypesMembers(node);
	}

	for (const member of node.members) {
		yield * checkNestedTypes(member.value);
	}
}

function * checkTypesObject(objectNode, packageType) {
	const typesMembers = yield * checkTypesMembers(objectNode);

	for (const member of typesMembers) {
		yield * checkNestedTypes(member.value);
	}

	const reportedFormats = new WeakMap();

	for (const member of typesMembers) {
		for (const [typeTarget, runtimeTarget] of iterateTypeRuntimePairs(member.value, objectNode)) {
			const problem = getModuleFormatProblem(typeTarget, runtimeTarget, packageType, reportedFormats);

			if (problem) {
				yield problem;
			}
		}
	}
}

function getNarrowedTypeNodes(nodes, runtimeKey) {
	const narrowedNodes = [];

	for (const node of nodes) {
		if (node.type === 'Array') {
			const firstTarget = getFirstTarget(node);

			if (firstTarget) {
				narrowedNodes.push(...getNarrowedTypeNodes([firstTarget], runtimeKey));
			}

			continue;
		}

		if (node.type !== 'Object') {
			narrowedNodes.push(node);
			continue;
		}

		const matchingMember = node.members.find(member => getKey(member) === runtimeKey);
		const fallbackMember = node.members.find(member => isTypesCondition(getKey(member)) || getKey(member) === 'default');

		if (matchingMember) {
			const matchingTarget = getTargetWithFallback(matchingMember.value, fallbackMember === matchingMember ? undefined : fallbackMember);
			narrowedNodes.push(matchingTarget);

			if (matchingTarget !== matchingMember.value || !canTypeTargetFallThrough(matchingTarget)) {
				continue;
			}
		}

		if (!fallbackMember || fallbackMember === matchingMember) {
			continue;
		}

		const fallbackTarget = getFallbackTarget(node, fallbackMember);
		const shouldNarrowFallback = fallbackTarget.type === 'Object' && fallbackTarget.members.some(member => getKey(member) === runtimeKey || isTypesCondition(getKey(member)));
		narrowedNodes.push(...(shouldNarrowFallback ? getNarrowedTypeNodes([fallbackTarget], runtimeKey) : [fallbackTarget]));
	}

	return narrowedNodes;
}

function hasTypeScopeCoverage(scope) {
	const unversionedGroup = scope.find(group => group.isUnversioned);
	const hasGroupCoverage = group => group.nodes.some(node => hasUsableTypeTarget(node));

	return (unversionedGroup && hasGroupCoverage(unversionedGroup)) || scope.every(group => hasGroupCoverage(group));
}

function hasUsableTypeTarget(node) {
	return hasTypesCoverage(node, {type: 'String'});
}

function * checkNode(node, packageType, inheritedScopes = []) {
	switch (node.type) {
		case 'Object': {
			const typesMembers = node.members.filter(member => isTypesCondition(getKey(member)));

			if (node.members.some(member => isTypesConditionKey(getKey(member)))) {
				yield * checkTypesObject(node, packageType);
			}

			for (const member of node.members) {
				const key = getKey(member);

				if (isTypesCondition(key)) {
					continue;
				}

				const scopes = inheritedScopes.map(scope => scope.map(group => ({...group, nodes: getNarrowedTypeNodes(group.nodes, key)})));

				if (typesMembers.length > 0) {
					scopes.push(typesMembers.map(typesMember => ({
						isUnversioned: getKey(typesMember) === 'types',
						nodes: getNarrowedTypeNodes([typesMember.value], key),
					})));
				}

				yield * checkNode(member.value, packageType, scopes);
			}

			break;
		}

		case 'Array': {
			const firstTarget = getFirstTarget(node);

			if (firstTarget) {
				yield * checkNode(firstTarget, packageType, inheritedScopes);
			}

			break;
		}

		case 'String': {
			if (inheritedScopes.some(scope => hasTypeScopeCoverage(scope)) || !isRuntimeTarget(node.value)) {
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
		return node.members.some(member => isTypesConditionKey(getKey(member)) || hasTypesCondition(member.value));
	}

	if (node.type === 'Array') {
		const firstTarget = getFirstTarget(node);
		return Boolean(firstTarget && hasTypesCondition(firstTarget));
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
