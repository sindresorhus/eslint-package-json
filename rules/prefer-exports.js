import {getRootObject, findMember} from './utils/index.js';

const MESSAGE_ID = 'prefer-exports';

const messages = {
	[MESSAGE_ID]: 'Prefer an `exports`-first package interface instead of `{{field}}`.',
};

// Fields this opinionated rule reports to enforce an `exports`-first package interface.
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
			description: 'Prefer an `exports`-first package interface.',
			recommended: false,
		},
		schema: [],
		messages,
		languages: ['json/json'],
	},
};

export default config;
