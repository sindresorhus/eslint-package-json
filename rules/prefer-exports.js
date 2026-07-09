import {getRootObject, findMember} from './utils/index.js';

const MESSAGE_ID = 'prefer-exports';

const messages = {
	[MESSAGE_ID]: 'Define entry points through the `exports` field instead of `{{field}}`.',
};

// Legacy entry-point fields that `exports` (with its conditions) supersedes. A top-level `types`/`typings` is silently ignored by modern TypeScript module resolution once `exports` is present, so those belong inside an `exports` `types` condition too.
const legacyFields = [
	'main',
	'module',
	'browser',
	'types',
	'typings',
];

/** @param {import('eslint').Rule.RuleContext} context */
const create = context => ({
	Document(node) {
		const root = getRootObject(node);

		if (!root) {
			return;
		}

		for (const field of legacyFields) {
			const member = findMember(root, field);

			if (member) {
				context.report({
					node: member.name,
					messageId: MESSAGE_ID,
					data: {field},
				});
			}
		}
	},
});

/** @type {import('eslint').Rule.RuleModule} */
const config = {
	create,
	meta: {
		type: 'suggestion',
		docs: {
			description: 'Prefer the `exports` field over legacy entry-point fields.',
			recommended: true,
		},
		schema: [],
		messages,
		languages: ['json/json'],
	},
};

export default config;
