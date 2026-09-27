import {
	getRootObject,
	findMember,
	getKey,
	withoutShadowedMembers,
} from './utils/index.js';

const MESSAGE_ID_MISSING = 'missing';
const MESSAGE_ID_TYPES_FIRST = 'typesFirst';
const MESSAGE_ID_TYPES_EXTENSION = 'typesExtension';
const MESSAGE_ID_TYPES_VALUE = 'typesValue';
const MESSAGE_ID_TYPES_VERSION = 'typesVersion';

const messages = {
	[MESSAGE_ID_MISSING]: 'Exported JavaScript target `{{value}}` has no corresponding `types` condition.',
	[MESSAGE_ID_TYPES_FIRST]: 'Versioned type conditions must come before `types`, and type conditions must come before a `default` target and before an `import` or `node` target.',
	[MESSAGE_ID_TYPES_EXTENSION]: 'The `types` condition `{{value}}` must point at a declaration file ending in `.d.ts`, `.d.mts`, or `.d.cts`.',
	[MESSAGE_ID_TYPES_VALUE]: 'The `types` condition must point to a declaration file.',
	[MESSAGE_ID_TYPES_VERSION]: 'Versioned type condition `{{key}}` must use TypeScript-compatible semver syntax.',
};

const declarationPathPattern = /\.d\.(?:ts|mts|cts)$/u;
const javascriptPathPattern = /\.(?:c|m)?js$/u;
// A TypeScript file or a declaration, which ends the same way (`.d.ts`, `.d.mts`, `.d.cts`).
const typeScriptPathPattern = /\.(?:[cm]ts|tsx?)$/u;
const typesVersionPartialPattern = /^(?:[*0Xx]|[1-9]\d*)(?:\.(?:[*0Xx]|[1-9]\d*)(?:\.(?:[*0Xx]|[1-9]\d*)(?:-(?<prerelease>[\d\-.A-Za-z]+))?(?:\+(?<build>[\d\-.A-Za-z]+))?)?)?$/u;
const typesVersionPrereleasePattern = /^(?:0|[1-9]\d*|[-A-Za-z][\d\-A-Za-z]*)(?:\.(?:0|[1-9]\d*|[-A-Za-z][\d\-A-Za-z]*))*$/u;
const typesVersionBuildPattern = /^[\d\-A-Za-z]+(?:\.[\d\-A-Za-z]+)*$/u;
const typesVersionComparatorPattern = /^(?:<=|>=|[<=>^~])?([\d*+\-.A-Za-z]+)$/u;
const typesVersionHyphenPattern = /^([\d*+\-.A-Za-z]+)\s+-\s+([\d*+\-.A-Za-z]+)$/u;

/*
The conditions TypeScript resolves `exports` with for an ES module consumer: `nodenext` for an importing file, and `bundler`, which never sets `node`. CommonJS consumers are out of scope. TypeScript sets no other condition, such as `browser`, `bun`, or `development`, unless `customConditions` asks for it, which this rule does not model.
*/
const typeScriptConditionSets = [
	['types', 'node', 'import'],
	['types', 'import'],
];

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

function getFirstTarget(node) {
	while (node?.type === 'Array') {
		node = node.elements[0]?.value;
	}

	return node;
}

function isMatchingCondition(key, conditions) {
	// The rule cannot know the TypeScript version, so it assumes every well-formed `types@` range matches.
	return key === 'default'
		|| conditions.includes(key)
		|| (key.startsWith('types@') && conditions.includes('types') && isTypesCondition(key));
}

/**
Resolve an `exports` target the way TypeScript and Node.js do: the first matching key of a conditions object wins, a target that resolves to nothing falls through to the next key, and an array takes its first element that resolves.

@returns {object | undefined} The `String` node the resolution settles on, the `Null` node that blocks it, or `undefined` when nothing matches.
*/
function resolve(node, conditions) {
	switch (node.type) {
		case 'String': {
			// TypeScript skips a target that is not a relative path, and Node.js rejects it. While looking for types, TypeScript takes a TypeScript file or a declaration as it is, and for any other target, JavaScript, JSON or CSS alike, it looks for a declaration next to it and skips the target without one. This rule does not look for that declaration. A pattern target ending in `*` gets its extension from the specifier, so it is taken as written.
			if (!node.value.startsWith('./') || (conditions.includes('types') && !typeScriptPathPattern.test(node.value) && !node.value.endsWith('*'))) {
				return undefined;
			}

			return node;
		}

		case 'Null': {
			return node;
		}

		case 'Array': {
			for (const element of node.elements) {
				const target = resolve(element.value, conditions);

				if (target) {
					return target;
				}
			}

			return undefined;
		}

		case 'Object': {
			for (const member of node.members) {
				if (!isMatchingCondition(getKey(member), conditions)) {
					continue;
				}

				const target = resolve(member.value, conditions);

				if (target) {
					return target;
				}
			}

			return undefined;
		}

		default: {
			return undefined;
		}
	}
}

/**
Get the JavaScript that one TypeScript mode loads for a target, when that mode finds no declaration for it.
*/
function getUntypedTarget(node, conditions) {
	const runtimeTarget = resolve(node, conditions.filter(condition => condition !== 'types'));

	if (runtimeTarget?.type !== 'String' || !javascriptPathPattern.test(runtimeTarget.value)) {
		return undefined;
	}

	const typesTarget = resolve(node, conditions);

	if (!typesTarget || typesTarget.type === 'Null') {
		return runtimeTarget;
	}

	return undefined;
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

function hasMalformedTarget(node) {
	node = getFirstTarget(node);

	if (!node) {
		return false;
	}

	if (['Boolean', 'Number'].includes(node.type)) {
		return true;
	}

	if (node.type === 'String') {
		return node.value === '';
	}

	return node.type === 'Object' && node.members.some(member => hasMalformedTarget(member.value));
}

/**
Whether a condition written before a type condition hands one of TypeScript's modes JavaScript without types of its own, so TypeScript takes a declaration sitting next to that JavaScript over the type condition.
*/
function isShadowingTypes(member) {
	const key = getKey(member);
	return typeScriptConditionSets.some(conditions => conditions.includes(key) && getUntypedTarget(member.value, conditions) !== undefined);
}

function * checkTypesMembers(objectNode) {
	for (const [index, member] of objectNode.members.entries()) {
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

		const previousMembers = objectNode.members.slice(0, index);
		const effectiveTypeNode = getFirstTarget(member.value);
		const typeTargets = effectiveTypeNode ? [...iterateStringLeaves(effectiveTypeNode)] : [];

		// `default` always matches, and so does `types` ahead of a `types@` key, so the type condition after either is dead.
		if (previousMembers.some(previousMember => getKey(previousMember) === 'default' || (key !== 'types' && getKey(previousMember) === 'types') || isShadowingTypes(previousMember))) {
			yield {
				node: member.name,
				messageId: MESSAGE_ID_TYPES_FIRST,
			};
		}

		if (!hasMalformedTarget(member.value) && typeTargets.length === 0) {
			yield {
				node: member.value,
				messageId: MESSAGE_ID_TYPES_VALUE,
			};
		}

		for (const leaf of typeTargets) {
			// A pattern target like `./types/*` gets its extension from the specifier.
			if (leaf.value !== '' && !leaf.value.endsWith('*') && !declarationPathPattern.test(leaf.value)) {
				yield {
					node: leaf,
					messageId: MESSAGE_ID_TYPES_EXTENSION,
					data: {value: leaf.value},
				};
			}
		}
	}
}

/**
Get the elements of an array that TypeScript may reach: it takes the first element that resolves, so the elements after one that resolves in every mode are never consulted.
*/
function getReachableElements(arrayNode) {
	const elements = [];

	for (const element of arrayNode.elements) {
		elements.push(element.value);

		if (typeScriptConditionSets.every(conditions => resolve(element.value, conditions))) {
			break;
		}
	}

	return elements;
}

function * iterateObjects(node) {
	if (node.type === 'Array') {
		for (const element of getReachableElements(node)) {
			yield * iterateObjects(element);
		}

		return;
	}

	if (node.type !== 'Object') {
		return;
	}

	yield node;

	for (const member of node.members) {
		yield * iterateObjects(member.value);
	}
}

function getSubpathTargets(exportsValue) {
	if (exportsValue.type === 'Object' && exportsValue.members.some(member => getKey(member).startsWith('.'))) {
		return exportsValue.members.map(member => member.value);
	}

	return [exportsValue];
}

function * checkMissing(exportsValue) {
	const untypedTargets = new Set();

	for (const target of getSubpathTargets(exportsValue)) {
		for (const conditions of typeScriptConditionSets) {
			const untypedTarget = getUntypedTarget(target, conditions);

			if (untypedTarget) {
				untypedTargets.add(untypedTarget);
			}
		}
	}

	for (const node of untypedTargets) {
		yield {
			node,
			messageId: MESSAGE_ID_MISSING,
			data: {value: node.value},
		};
	}
}

function hasTypesCondition(node) {
	if (node.type === 'Object') {
		return node.members.some(member => isTypesConditionKey(getKey(member)) || hasTypesCondition(member.value));
	}

	if (node.type === 'Array') {
		return getReachableElements(node).some(element => hasTypesCondition(element));
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

		// TypeScript ignores all three once `exports` is present, so a package that declares types through any of them still needs a type condition.
		const isTopLevelTypes = [findMember(root, 'types'), findMember(root, 'typings')].some(member => member?.value.type === 'String')
			|| findMember(root, 'typesVersions')?.value.type === 'Object';

		// This rule reasons about what TypeScript resolves, so it walks the tree as `JSON.parse` builds it. Traversing the raw members would let a shadowed duplicate supply a declaration that no consumer ever sees.
		const exportsValue = withoutShadowedMembers(exportsMember.value);

		if (!isTopLevelTypes && !hasTypesCondition(exportsValue)) {
			return;
		}

		for (const object of iterateObjects(exportsValue)) {
			for (const problem of checkTypesMembers(object)) {
				context.report(problem);
			}
		}

		for (const problem of checkMissing(exportsValue)) {
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
			description: 'Require correctly ordered types in `exports`.',
			recommended: true,
		},
		schema: [],
		messages,
		languages: ['json/json'],
	},
};

export default config;
