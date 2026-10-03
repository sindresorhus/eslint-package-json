import {getRootObject, findMember} from './utils/index.js';

const MESSAGE_ID = 'prefer-exports';

const messages = {
	[MESSAGE_ID]: 'Prefer an `exports`-first package interface instead of `{{field}}`.',
};

// Fields this opinionated rule reports to enforce an `exports`-first package interface. It holds the same names as `pathFields` today, but on purpose it is not that list: a new field with one path is not always one that `exports` replaces.
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

			if (member && (field !== 'browser' || member.value.type === 'String')) {
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
			recommended: true,
		},
		schema: [],
		messages,
		languages: ['json/json'],
	},
};

export default config;
