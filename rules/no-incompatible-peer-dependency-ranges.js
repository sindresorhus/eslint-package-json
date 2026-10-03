import semver from 'semver';
import {
	getRootObject,
	runtimeDependencyTypes,
	hasDependency,
	iterateDependencies,
	targetsPrerelease,
	validRange,
} from './utils/index.js';

const MESSAGE_ID = 'no-incompatible-peer-dependency-ranges';
const USE_PEER_RANGE_SUGGESTION_ID = 'use-peer-range';
const USE_DEPENDENCY_RANGE_SUGGESTION_ID = 'use-dependency-range';

const messages = {
	[MESSAGE_ID]: 'Dependency `{{name}}` in `{{groupName}}` uses range `{{dependencyRange}}`, which does not overlap its peer dependency range `{{peerRange}}`.',
	[USE_PEER_RANGE_SUGGESTION_ID]: 'Use the peer dependency range `{{peerRange}}` in `{{groupName}}`.',
	[USE_DEPENDENCY_RANGE_SUGGESTION_ID]: 'Use the `{{groupName}}` range `{{dependencyRange}}` in `peerDependencies`.',
};

const hasStableVersions = range => semver.toComparators(range).some(comparators => semver.minVersion(comparators.join(' ')) !== null);

const hasStableRangeOverlap = (firstRange, secondRange) => {
	const secondComparatorSets = semver.toComparators(secondRange);

	return semver.toComparators(firstRange).some(firstComparators => secondComparatorSets.some(secondComparators => semver.minVersion([...firstComparators, ...secondComparators].join(' ')) !== null));
};

/** @param {import('eslint').Rule.RuleContext} context */
const create = context => ({
	Document(node) {
		const root = getRootObject(node);

		if (!root) {
			return;
		}

		const peerDependencies = new Map();

		for (const {member, name} of iterateDependencies(root, ['peerDependencies'])) {
			if (
				member.value.type === 'String'
				&& validRange(member.value.value) !== null
				&& !targetsPrerelease(member.value.value)
			) {
				peerDependencies.set(name, member);
			}
		}

		// Npm documents that an `optionalDependencies` entry overrides a `dependencies` entry of the same name, so the `dependencies` value is never installed. Comparing it would report a conflict that cannot happen and offer to rewrite a range nothing uses; `no-duplicate-dependencies` reports the duplication itself.
		for (const {groupName, member, name} of iterateDependencies(root, runtimeDependencyTypes)) {
			const peerMember = peerDependencies.get(name);

			if (
				!peerMember
				|| member.value.type !== 'String'
				|| (groupName === 'dependencies' && hasDependency(root, name, ['optionalDependencies']))
			) {
				continue;
			}

			const peerRange = peerMember.value.value;
			const dependencyRange = member.value.value;

			if (
				validRange(dependencyRange) === null
				|| targetsPrerelease(dependencyRange)
				|| hasStableRangeOverlap(peerRange, dependencyRange)
			) {
				continue;
			}

			const suggest = [];

			if (hasStableVersions(peerRange)) {
				suggest.push({
					messageId: USE_PEER_RANGE_SUGGESTION_ID,
					data: {groupName, peerRange},
					fix: fixer => fixer.replaceText(member.value, JSON.stringify(peerRange)),
				});
			}

			if (hasStableVersions(dependencyRange)) {
				suggest.push({
					messageId: USE_DEPENDENCY_RANGE_SUGGESTION_ID,
					data: {groupName, dependencyRange},
					fix: fixer => fixer.replaceText(peerMember.value, JSON.stringify(dependencyRange)),
				});
			}

			context.report({
				node: member.value,
				messageId: MESSAGE_ID,
				data: {
					name,
					groupName,
					dependencyRange,
					peerRange,
				},
				suggest,
			});
		}
	},
});

/** @type {import('eslint').Rule.RuleModule} */
const config = {
	create,
	meta: {
		type: 'problem',
		docs: {
			description: 'Disallow incompatible ranges for peer dependencies also listed as runtime dependencies.',
			recommended: true,
		},
		hasSuggestions: true,
		schema: [],
		messages,
		languages: ['json/json'],
	},
};

export default config;
