import {getRootObject, iteratePathValueNodes} from './utils/index.js';

const MESSAGE_ID = 'no-absolute-paths';
const MESSAGE_ID_FILES_PATTERN = 'files-leading-slash';
const SUGGESTION_ID_REMOVE_SLASH = 'remove-leading-slash';

const messages = {
	[MESSAGE_ID]: 'Path `{{value}}` must be relative, not absolute.',
	[MESSAGE_ID_FILES_PATTERN]: '`files` pattern `{{value}}` is already relative to the package root. Write it as `{{expected}}`.',
	[SUGGESTION_ID_REMOVE_SLASH]: 'Remove the leading slash.',
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

		for (const {node: valueNode, field} of iteratePathValueNodes(root)) {
			const {value} = valueNode;
			// Only a `files` entry can be negated, and the `!` prefix is not part of the path.
			const negation = field === 'files' ? value.match(/^!*/)[0] : '';
			const pattern = value.slice(negation.length);

			// A `files` entry is a pattern, not a path to resolve: npm strips a leading `/` and matches from the package root, so `/dist` and `dist` publish the same files. The slash still reads as an absolute path, so report it and offer the shorter form. A Windows drive is not stripped and falls through to the absolute-path report below.
			if (field === 'files' && pattern.startsWith('/')) {
				const stripped = pattern.replace(/^\/+/u, '');

				// A pattern of nothing but slashes leaves no shorter form to suggest, so it falls through to the absolute-path report below.
				if (stripped !== '') {
					const expected = negation + stripped;

					context.report({
						node: valueNode,
						messageId: MESSAGE_ID_FILES_PATTERN,
						data: {value, expected},
						suggest: [{
							messageId: SUGGESTION_ID_REMOVE_SLASH,
							fix: fixer => fixer.replaceText(valueNode, JSON.stringify(expected)),
						}],
					});

					continue;
				}
			}

			if (isAbsolutePath(pattern)) {
				context.report({
					node: valueNode,
					messageId: MESSAGE_ID,
					data: {value: pattern},
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
		hasSuggestions: true,
		schema: [],
		messages,
		languages: ['json/json'],
	},
};

export default config;
