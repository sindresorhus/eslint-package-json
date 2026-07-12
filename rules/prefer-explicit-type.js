import {getRootObject, findMember} from './utils/index.js';

const MESSAGE_ID = 'prefer-explicit-type';

const messages = {
	[MESSAGE_ID]: 'Declare the package module format explicitly with a `type` field.',
};

/** @param {import('eslint').Rule.RuleContext} context */
const create = context => ({
	Document(node) {
		const root = getRootObject(node);

		if (!root || findMember(root, 'type')) {
			return;
		}

		context.report({
			node: root,
			messageId: MESSAGE_ID,
		});
	},
});

/** @type {import('eslint').Rule.RuleModule} */
const config = {
	create,
	meta: {
		type: 'suggestion',
		docs: {
			description: 'Require an explicit `type` field.',
			recommended: true,
		},
		schema: [],
		messages,
		languages: ['json/json'],
	},
};

export default config;
