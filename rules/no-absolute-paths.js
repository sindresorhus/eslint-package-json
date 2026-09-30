import {getRootObject, isAlwaysIncludedFile, iteratePathValueNodes} from './utils/index.js';

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
			// An `exports` or `imports` target is `valid-fields`' to report: it names the field, it says what the target has to start with, and it carries the rewrite. A second, vaguer report on the same node for the same string is noise.
			if (field === 'exports' || field === 'imports') {
				continue;
			}

			const {value} = valueNode;
			// Only a `files` entry can be negated, and the `!` prefix is not part of the path.
			const negation = field === 'files' ? value.match(/^!*/)[0] : '';
			const pattern = value.slice(negation.length);

			// A leading slash on a file npm includes anyway is not a spelling problem: the entry is removable altogether, which is what `no-redundant-files` reports. Rewriting the spelling would keep it.
			if (field === 'files' && isAlwaysIncludedFile(pattern)) {
				continue;
			}

			// A `files` entry is a pattern, not a path to resolve: npm strips a leading `/` and matches from the package root, so `/dist` and `dist` publish the same files. The slash still reads as an absolute path, so report it and offer the shorter form. A Windows drive is not stripped and falls through to the absolute-path report below.
			if (field === 'files' && pattern.startsWith('/')) {
				const stripped = pattern.replace(/^\/+/u, '');

				// A pattern of nothing but slashes leaves no shorter form to suggest, so it falls through to the absolute-path report below. Two or more leading slashes do too: npm strips only the first, so `//dist` publishes nothing, and no shorter spelling means the same thing.
				if (stripped !== '' && pattern === `/${stripped}`) {
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

			// Npm strips one leading `./` from a `files` entry, so `.//dist` is the absolute `/dist` and publishes nothing.
			const path = field === 'files' ? pattern.replace(/^\.\//u, '') : pattern;

			if (isAbsolutePath(path)) {
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
