import semver from 'semver';
import {
	getRootObject,
	installedSpecifier,
	iterateDependencies,
	validVersion,
	canonicalVersion,
} from './utils/index.js';

const MESSAGE_ID = 'no-exact-peer-dependencies';
const CARET_SUGGESTION_ID = 'caret';
const GTE_SUGGESTION_ID = 'gte';

const messages = {
	[MESSAGE_ID]: 'Peer dependency `{{name}}` is pinned to the exact version `{{version}}`; use a range instead.',
	[CARET_SUGGESTION_ID]: 'Use a caret range.',
	[GTE_SUGGESTION_ID]: 'Use a `>=` range.',
};

/**
Get the open-ended lower bound a `>=` suggestion should start from, or `undefined` when no bound is a real range.

A major version of `0` carries no release-line information, and `>=0` normalizes to `*`. Neither does major.minor, since `>=0.0.0` is also `*`, so a `0.x` version needs the whole version as its bound. `0.0.0` is the one pin with no bound left, and a range that admits every version is the opposite of what this rule asks for.
*/
const getLowerBound = normalized => {
	const {major, minor, patch} = semver.parse(normalized);
	const bound = major === 0 ? `0.${minor}.${patch}` : String(major);
	return semver.validRange('>=' + bound) === '*' ? undefined : bound;
};

/** @param {import('eslint').Rule.RuleContext} context */
const create = context => ({
	Document(node) {
		const root = getRootObject(node);

		if (!root) {
			return;
		}

		for (const {member, name} of iterateDependencies(root, ['peerDependencies'])) {
			if (member.value.type !== 'String') {
				continue;
			}

			const specifier = member.value.value;
			// An `npm:` alias installs at the range it carries, so `npm:foo@1.2.3` pins one version just like `1.2.3` does. What precedes the installed range is the alias, found by searching for the range rather than by measuring the tail, since `npm-package-arg` trims the range it reports and a trailing space would otherwise land the prefix in the middle of the version.
			const version = installedSpecifier(specifier);
			const aliasPrefix = specifier.slice(0, specifier.lastIndexOf(version));

			// `validVersion` returns non-`null` only for a single exact version (e.g. `1.2.3`), not ranges, wildcards, or other specifiers. It wants that version bare, so an `=`-prefixed pin (`=1.2.3`) has its operator removed first. That form satisfies exactly one version just like the bare pin, which is the same anti-pattern. Only one operator goes: `==1.2.3` is not a range at all, which is `dependency-version-range`'s business.
			const normalized = validVersion(version) ?? validVersion(version.replace(/^=/u, ''));

			if (normalized === null) {
				continue;
			}

			const lowerBound = getLowerBound(normalized);

			const suggestions = [
				{
					messageId: CARET_SUGGESTION_ID,
					// Build the range from the canonical version so a loose input like `v1.2.3` becomes a clean `^1.2.3`, while a `+build` the author wrote survives the rewrite.
					fix: fixer => fixer.replaceText(member.value, JSON.stringify(aliasPrefix + '^' + canonicalVersion(version))),
				},
			];

			if (lowerBound !== undefined) {
				suggestions.push({
					messageId: GTE_SUGGESTION_ID,
					fix: fixer => fixer.replaceText(member.value, JSON.stringify(aliasPrefix + '>=' + lowerBound)),
				});
			}

			context.report({
				node: member.value,
				messageId: MESSAGE_ID,
				data: {name, version: specifier},
				suggest: suggestions,
			});
		}
	},
});

/** @type {import('eslint').Rule.RuleModule} */
const config = {
	create,
	meta: {
		type: 'suggestion',
		docs: {
			description: 'Disallow exact versions for peer dependencies.',
			recommended: false,
		},
		hasSuggestions: true,
		schema: [],
		messages,
		languages: ['json/json'],
	},
};

export default config;
