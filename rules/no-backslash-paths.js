import {getRootObject, iteratePathValueNodes} from './utils/index.js';

const MESSAGE_ID = 'no-backslash-paths';
const SUGGESTION_ID = 'use-forward-slashes';

const messages = {
	[MESSAGE_ID]: 'Path `{{value}}` must use forward slashes, not backslashes.',
	[SUGGESTION_ID]: 'Replace the backslashes with forward slashes.',
};

/** @param {import('eslint').Rule.RuleContext} context */
const create = context => ({
	Document(node) {
		const root = getRootObject(node);

		if (!root) {
			return;
		}

		for (const {node: valueNode, field} of iteratePathValueNodes(root)) {
			if (!valueNode.value.includes('\\')) {
				continue;
			}

			const fix = fixer => fixer.replaceText(valueNode, JSON.stringify(valueNode.value.replaceAll('\\', '/')));

			context.report({
				node: valueNode,
				messageId: MESSAGE_ID,
				data: {value: valueNode.value},
				// Npm 12 hands a `files` entry to `glob`, where a `\` escapes the next character on every platform, so `.\dist` publishes `.dist` and the rewrite changes what ships.
				...(field === 'files' ? {suggest: [{messageId: SUGGESTION_ID, fix}]} : {fix}),
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
		hasSuggestions: true,
		schema: [],
		messages,
		languages: ['json/json'],
	},
};

export default config;
