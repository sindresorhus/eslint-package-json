import npa from 'npm-package-arg';
import semver from 'semver';
import {
	findMember,
	getIndentString,
	getKey,
	getRootObject,
	iterateEffectiveMembers,
	lineIndentOf,
} from './utils/index.js';

const MESSAGE_ID = 'no-invalid-direct-overrides';
const MESSAGE_ID_UNRESOLVED_REFERENCE = 'unresolvedReference';
const SUGGESTION_ID = 'useReference';

const messages = {
	[MESSAGE_ID]: 'Override for direct dependency `{{name}}` conflicts with its `{{specifier}}` specifier.',
	[MESSAGE_ID_UNRESOLVED_REFERENCE]: 'Override for direct dependency `{{name}}` references `{{reference}}`, which does not resolve to a dependency specifier of this package.',
	[SUGGESTION_ID]: 'Reference the direct dependency with `{{reference}}`.',
};

// This is the order npm uses when loading root dependencies. Later groups replace earlier ones with the same name.
const dependencyGroupPrecedence = [
	'peerDependencies',
	'dependencies',
	'optionalDependencies',
	'devDependencies',
];

const getCaseInsensitiveKey = name => name.normalize('NFKD').toLowerCase();

const getDirectDependencies = root => {
	const dependencies = new Map();

	for (const groupName of dependencyGroupPrecedence) {
		const group = findMember(root, groupName);

		if (group?.value.type !== 'Object') {
			continue;
		}

		for (const member of group.value.members) {
			const name = getKey(member);
			const key = getCaseInsensitiveKey(name);

			if (member.value.type === 'String') {
				dependencies.set(key, {name, specifier: member.value.value});
			} else {
				dependencies.delete(key);
			}
		}
	}

	return dependencies;
};

/**
The specifier a `$name` reference resolves to, looked up the way npm does: the first non-empty one, `''` when there is none, which npm refuses with `Unable to resolve reference $name`, or `undefined` for a non-string one, which is `valid-fields`' business.
*/
const getReferencedSpecifier = (root, name) => {
	for (const groupName of dependencyGroupPrecedence.toReversed()) {
		const group = findMember(root, groupName);
		const member = findMember(group?.value, name);

		if (!member) {
			continue;
		}

		if (member.value.type !== 'String') {
			return undefined;
		}

		if (member.value.value) {
			return member.value.value;
		}
	}

	return '';
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

	const self = findMember(member.value, '.');

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
		const newline = '\n';
		return fixer.insertTextAfterRange([object.range[0], object.range[0] + 1], `${newline}${memberIndent}${entry}`);
	}

	const leading = sourceCode.text.slice(object.range[0] + 1, firstMember.range[0]);
	const lastNewline = leading.lastIndexOf('\n');

	if (lastNewline === -1) {
		return fixer.insertTextAfterRange([object.range[0], object.range[0] + 1], `${entry},`);
	}

	const indent = leading.slice(lastNewline + 1);
	return fixer.insertTextAfterRange([object.range[0], object.range[0] + 1], `\n${indent}${entry},`);
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

			const overrides = findMember(root, 'overrides');

			if (overrides?.value.type !== 'Object') {
				return;
			}

			const directDependencies = getDirectDependencies(root);

			const matchedOverridePackageNames = new Set();

			for (const member of iterateEffectiveMembers(overrides.value)) {
				const override = parseOverrideKey(getKey(member));

				if (!override) {
					continue;
				}

				const directDependency = directDependencies.get(getCaseInsensitiveKey(override.packageName));
				const directSpecifier = directDependency?.specifier;

				if (
					directSpecifier === undefined
					|| directDependency.name !== override.packageName
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
					const reference = overrideSpecifier.slice(1);
					const referencedSpecifier = getReferencedSpecifier(root, reference);

					// A non-string referenced specifier is `valid-fields`' business.
					if (referencedSpecifier === undefined) {
						continue;
					}

					// Npm refuses to install at all with `Unable to resolve reference $x` when no group gives the name a non-empty specifier, so this is a hard failure of its own rather than a conflict to report.
					if (referencedSpecifier === '') {
						context.report({
							node: effectiveOverride.node,
							messageId: MESSAGE_ID_UNRESOLVED_REFERENCE,
							data: {name: override.packageName, reference: '$' + reference},
						});

						continue;
					}

					overrideSpecifier = referencedSpecifier;
				}

				// Npm does not follow a chained `$a` whose value is itself `$b`; it reads that as a dist-tag.
				if (overrideSpecifier === directSpecifier || overrideSpecifier.startsWith('$')) {
					continue;
				}

				context.report({
					node: effectiveOverride.node,
					messageId: MESSAGE_ID,
					data: {name: override.packageName, specifier: directSpecifier},
					// A suggestion, since the override often exists to force another version (such as a security fix) on every transitive copy of the package, and the reference drops that.
					suggest: [
						{
							messageId: SUGGESTION_ID,
							data: {reference: '$' + override.packageName},
							fix: fixer => effectiveOverride.node.type === 'Object'
								? fixImplicitOverride(fixer, sourceCode, effectiveOverride.node, override.packageName)
								: fixer.replaceText(effectiveOverride.node, getFixedOverride(override.packageName)),
						},
					],
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
		hasSuggestions: true,
		schema: [],
		messages,
		languages: ['json/json'],
	},
};

export default config;
