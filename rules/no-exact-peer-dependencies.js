import semver from 'semver';
import {getRootObject, iterateDependencies, validVersion} from './utils/index.js';

const MESSAGE_ID = 'no-exact-peer-dependencies';
const CARET_SUGGESTION_ID = 'caret';
const GTE_SUGGESTION_ID = 'gte';

const messages = {
	[MESSAGE_ID]: 'Peer dependency `{{name}}` is pinned to the exact version `{{version}}`; use a range instead.',
	[CARET_SUGGESTION_ID]: 'Use a caret range.',
	[GTE_SUGGESTION_ID]: 'Use a `>=` range from the major version.',
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

			const version = member.value.value;

			// `validVersion` returns non-`null` only for a single exact version (e.g. `1.2.3`), not ranges, wildcards, or other specifiers.
			if (validVersion(version) === null) {
				continue;
			}

			context.report({
				node: member.value,
				messageId: MESSAGE_ID,
				data: {name, version},
				suggest: [
					{
						messageId: CARET_SUGGESTION_ID,
						fix: fixer => fixer.replaceText(member.value, JSON.stringify('^' + version)),
					},
					{
						messageId: GTE_SUGGESTION_ID,
						fix: fixer => fixer.replaceText(member.value, JSON.stringify('>=' + semver.major(version))),
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
