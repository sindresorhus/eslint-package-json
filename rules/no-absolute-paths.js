import {getRootObject, iteratePathValueNodes} from './utils/index.js';

const MESSAGE_ID = 'no-absolute-paths';

const messages = {
	[MESSAGE_ID]: 'Path `{{value}}` must be relative, not absolute.',
};

const windowsDrivePattern = /^[a-z]:[/\\]/i;

/**
Check whether a path string is absolute (POSIX root or Windows drive), ignoring URLs.
*/
const isAbsolutePath = value => {
	if (value.includes('://')) {
		return false;
	}

	return value.startsWith('/') || windowsDrivePattern.test(value);
};

/** @param {import('eslint').Rule.RuleContext} context */
const create = context => ({
	Document(node) {
		const root = getRootObject(node);

		if (!root) {
			return;
		}

		for (const valueNode of iteratePathValueNodes(root)) {
			if (isAbsolutePath(valueNode.value)) {
				context.report({
					node: valueNode,
					messageId: MESSAGE_ID,
					data: {value: valueNode.value},
				});
			}
		}
	},
});

/** @type {import('eslint').Rule.RuleModule} */
const config = {
	create,
	meta: {
		type: 'problem',
		docs: {
			description: 'Disallow absolute paths in path fields.',
			recommended: true,
		},
		schema: [],
		messages,
		languages: ['json/json'],
	},
};

export default config;
