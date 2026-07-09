import {getRootObject, findMember, isPrivatePackage} from './utils/index.js';

const MESSAGE_ID = 'prefer-files-field';

const messages = {
	[MESSAGE_ID]: 'Add a `files` allowlist so only intended files are published.',
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

		if (findMember(root, 'files')) {
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
			description: 'Require a `files` allowlist.',
			recommended: true,
		},
		schema: [],
		messages,
		languages: ['json/json'],
	},
};

export default config;
