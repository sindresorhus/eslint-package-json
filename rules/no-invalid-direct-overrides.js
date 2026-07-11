import npa from 'npm-package-arg';
import semver from 'semver';
import {
	getIndentString,
	getKey,
	getNewline,
	getRootObject,
	lineIndentOf,
} from './utils/index.js';

const MESSAGE_ID = 'no-invalid-direct-overrides';

const messages = {
	[MESSAGE_ID]: 'Override for direct dependency `{{name}}` conflicts with its `{{specifier}}` specifier.',
};

// This is the order npm uses when loading root dependencies. Later groups replace earlier ones with the same name.
const dependencyGroupPrecedence = [
	'peerDependencies',
	'dependencies',
	'optionalDependencies',
	'devDependencies',
];

const arrayIndexPattern = /^(?:0|[1-9]\d*)$/;

const findLastMember = (object, key) => {
	let result;

	for (const member of object?.members ?? []) {
		if (getKey(member) === key) {
			result = member;
		}
	}

	return result;
};

const getArrayIndex = key => {
	if (!arrayIndexPattern.test(key)) {
		return undefined;
	}

	const index = Number(key);
	return index < (2 ** 32) - 1 ? index : undefined;
};

// Overrides are parsed as a JavaScript object, so final duplicate keys win and array-index keys enumerate first.
function * iterateOverrideMembers(members) {
	const membersByKey = new Map();
	const arrayIndexMembers = [];
	const stringMembers = [];

	for (const member of members) {
		membersByKey.set(getKey(member), member);
	}

	for (const member of membersByKey.values()) {
		const index = getArrayIndex(getKey(member));

		if (index === undefined) {
			stringMembers.push(member);
		} else {
			arrayIndexMembers.push({index, member});
		}
	}

	arrayIndexMembers.sort((first, second) => first.index - second.index);

	for (const {member} of arrayIndexMembers) {
		yield member;
	}

	yield * stringMembers;
}

const getDirectDependencies = root => {
	const dependencies = new Map();

	for (const groupName of dependencyGroupPrecedence) {
		const group = findLastMember(root, groupName);

		if (group?.value.type !== 'Object') {
			continue;
		}

		for (const member of group.value.members) {
			if (member.value.type === 'String') {
				dependencies.set(getKey(member), member.value.value);
			}
		}
	}

	return dependencies;
};

const parseOverrideKey = name => {
	try {
		const parsed = npa(name);
		const packageName = parsed.name;

		if (!packageName) {
			return undefined;
		}

		parsed.name = '';

		return {
			packageName,
			keySpecifier: parsed.toString(),
		};
	} catch {
		return undefined;
	}
};

const specifiersIntersect = (first, second) => {
	try {
		return semver.intersects(first, second);
	} catch {
		return false;
	}
};

const doesOverrideApply = (name, directSpecifier, override) => {
	if (override.keySpecifier === '*') {
		return true;
	}

	let specifier;

	try {
		specifier = npa(`${name}@${directSpecifier}`);
	} catch {
		return false;
	}

	if (specifier.type === 'alias') {
		specifier = specifier.subSpec;
	}

	if (specifier.type === 'git') {
		return specifier.gitRange !== undefined && specifiersIntersect(specifier.gitRange, override.keySpecifier);
	}

	if (specifier.type === 'range' || specifier.type === 'version') {
		return specifiersIntersect(specifier.fetchSpec, override.keySpecifier);
	}

	return true;
};

const getEffectiveOverride = (member, keySpecifier) => {
	if (member.value.type === 'String') {
		return {node: member.value, specifier: member.value.value};
	}

	if (member.value.type !== 'Object') {
		return undefined;
	}

	const self = findLastMember(member.value, '.');

	if (self) {
		return self.value.type === 'String' ? {node: self.value, specifier: self.value.value} : undefined;
	}

	if (keySpecifier === '*') {
		return undefined;
	}

	return {
		node: member.value,
		specifier: keySpecifier,
	};
};

const getFixedOverride = name => JSON.stringify(`$${name}`);

function fixImplicitOverride(fixer, sourceCode, object, name) {
	const value = getFixedOverride(name);
	const firstMember = object.members[0];
	const separator = firstMember
		? sourceCode.text.slice(firstMember.name.range[1], firstMember.value.range[0])
		: ': ';
	const entry = `"."${separator}${value}`;

	if (!firstMember) {
		if (!sourceCode.getText(object).includes('\n')) {
			return fixer.insertTextAfterRange([object.range[0], object.range[0] + 1], entry);
		}

		const memberIndent = lineIndentOf(sourceCode, object) + getIndentString(sourceCode);
		const newline = getNewline(sourceCode);
		return fixer.insertTextAfterRange([object.range[0], object.range[0] + 1], `${newline}${memberIndent}${entry}`);
	}

	const leading = sourceCode.text.slice(object.range[0] + 1, firstMember.range[0]);
	const lastNewline = leading.lastIndexOf('\n');

	if (lastNewline === -1) {
		return fixer.insertTextAfterRange([object.range[0], object.range[0] + 1], `${entry},`);
	}

	const indent = leading.slice(lastNewline + 1);
	return fixer.insertTextAfterRange([object.range[0], object.range[0] + 1], `${getNewline(sourceCode)}${indent}${entry},`);
}

/** @param {import('eslint').Rule.RuleContext} context */
const create = context => {
	const {sourceCode} = context;

	return {
		Document(node) {
			const root = getRootObject(node);

			if (!root) {
				return;
			}

			const overrides = findLastMember(root, 'overrides');

			if (overrides?.value.type !== 'Object') {
				return;
			}

			const directDependencies = getDirectDependencies(root);

			const matchedOverridePackageNames = new Set();

			for (const member of iterateOverrideMembers(overrides.value.members)) {
				const override = parseOverrideKey(getKey(member));

				if (!override) {
					continue;
				}

				const directSpecifier = directDependencies.get(override.packageName);

				if (
					directSpecifier === undefined
					|| matchedOverridePackageNames.has(override.packageName)
					|| !doesOverrideApply(override.packageName, directSpecifier, override)
				) {
					continue;
				}

				matchedOverridePackageNames.add(override.packageName);
				const effectiveOverride = getEffectiveOverride(member, override.keySpecifier);

				if (!effectiveOverride || effectiveOverride.specifier === '' || effectiveOverride.specifier === '*') {
					continue;
				}

				let overrideSpecifier = effectiveOverride.specifier;

				if (overrideSpecifier.startsWith('$')) {
					const referencedSpecifier = directDependencies.get(overrideSpecifier.slice(1));

					if (!referencedSpecifier) {
						continue;
					}

					overrideSpecifier = referencedSpecifier;
				}

				if (overrideSpecifier === directSpecifier || overrideSpecifier.startsWith('$')) {
					continue;
				}

				context.report({
					node: effectiveOverride.node,
					messageId: MESSAGE_ID,
					data: {name: override.packageName, specifier: directSpecifier},
					fix: fixer => effectiveOverride.node.type === 'Object'
						? fixImplicitOverride(fixer, sourceCode, effectiveOverride.node, override.packageName)
						: fixer.replaceText(effectiveOverride.node, getFixedOverride(override.packageName)),
				});
			}
		},
	};
};

/** @type {import('eslint').Rule.RuleModule} */
const config = {
	create,
	meta: {
		type: 'problem',
		docs: {
			description: 'Disallow npm overrides that conflict with direct dependencies.',
			recommended: true,
		},
		fixable: 'code',
		schema: [],
		messages,
		languages: ['json/json'],
	},
};

export default config;
