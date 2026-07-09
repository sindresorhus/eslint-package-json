import {getRootObject, findMember} from './utils/index.js';

const MESSAGE_ID = 'require-engines';

const messages = {
	[MESSAGE_ID]: 'Declare a supported Node.js version in `engines.node`.',
};

/** @param {import('eslint').Rule.RuleContext} context */
const create = context => ({
	Document(node) {
		const root = getRootObject(node);

		if (!root) {
			return;
		}

		const engines = findMember(root, 'engines');

		if (engines?.value.type === 'Object' && findMember(engines.value, 'node')) {
			return;
		}

		context.report({
			node: engines?.name ?? root,
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
			description: 'Require the `engines.node` field.',
			recommended: true,
		},
		schema: [],
		messages,
		languages: ['json/json'],
	},
};

export default config;
