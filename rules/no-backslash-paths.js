import {getRootObject, iteratePathValueNodes} from './utils/index.js';

const MESSAGE_ID = 'no-backslash-paths';

const messages = {
	[MESSAGE_ID]: 'Path `{{value}}` must use forward slashes, not backslashes.',
};

/** @param {import('eslint').Rule.RuleContext} context */
const create = context => ({
	Document(node) {
		const root = getRootObject(node);

		if (!root) {
			return;
		}

		for (const valueNode of iteratePathValueNodes(root)) {
			if (!valueNode.value.includes('\\')) {
				continue;
			}

			context.report({
				node: valueNode,
				messageId: MESSAGE_ID,
				data: {value: valueNode.value},
				fix: fixer => fixer.replaceText(valueNode, JSON.stringify(valueNode.value.replaceAll('\\', '/'))),
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
			description: 'Enforce forward slashes in path fields.',
			recommended: true,
		},
		fixable: 'code',
		schema: [],
		messages,
		languages: ['json/json'],
	},
};

export default config;
