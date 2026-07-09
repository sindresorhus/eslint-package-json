import {getRootObject, findMember, isPrivatePackage} from './utils/index.js';

const MESSAGE_ID = 'require-entry-point';

const messages = {
	[MESSAGE_ID]: 'Define an entry point via `exports`, `main`, or `bin`.',
};

/** @param {import('eslint').Rule.RuleContext} context */
const create = context => ({
	Document(node) {
		const root = getRootObject(node);

		if (!root) {
			return;
		}

		if (isPrivatePackage(root)) {
			return;
		}

		if (findMember(root, 'exports') || findMember(root, 'main') || findMember(root, 'bin')) {
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
			description: 'Require an entry point field.',
			recommended: true,
		},
		schema: [],
		messages,
		languages: ['json/json'],
	},
};

export default config;
