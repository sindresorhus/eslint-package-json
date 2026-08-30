import semver from 'semver';
import {getRootObject, iterateDependencies, validRange} from './utils/index.js';

const MESSAGE_ID = 'no-incompatible-peer-dependency-ranges';
const USE_PEER_RANGE_SUGGESTION_ID = 'use-peer-range';
const USE_DEPENDENCY_RANGE_SUGGESTION_ID = 'use-dependency-range';

const messages = {
	[MESSAGE_ID]: 'Dependency `{{name}}` in `{{groupName}}` uses range `{{dependencyRange}}`, which does not overlap its peer dependency range `{{peerRange}}`.',
	[USE_PEER_RANGE_SUGGESTION_ID]: 'Use the peer dependency range `{{peerRange}}` in `{{groupName}}`.',
	[USE_DEPENDENCY_RANGE_SUGGESTION_ID]: 'Use the `{{groupName}}` range `{{dependencyRange}}` in `peerDependencies`.',
};

const runtimeDependencyTypes = ['dependencies', 'optionalDependencies'];

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
			) {
				peerDependencies.set(name, member);
			}
		}

		for (const {groupName, member, name} of iterateDependencies(root, runtimeDependencyTypes)) {
			const peerMember = peerDependencies.get(name);

			if (
				!peerMember
				|| member.value.type !== 'String'
			) {
				continue;
			}

			const peerRange = peerMember.value.value;
			const dependencyRange = member.value.value;

			if (
				validRange(dependencyRange) === null
				|| semver.intersects(peerRange, dependencyRange)
			) {
				continue;
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
				suggest: [
					{
						messageId: USE_PEER_RANGE_SUGGESTION_ID,
						data: {groupName, peerRange},
						fix: fixer => fixer.replaceText(member.value, JSON.stringify(peerRange)),
					},
					{
						messageId: USE_DEPENDENCY_RANGE_SUGGESTION_ID,
						data: {groupName, dependencyRange},
						fix: fixer => fixer.replaceText(peerMember.value, JSON.stringify(dependencyRange)),
					},
				],
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
