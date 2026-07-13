import {
	getRootObject,
	findMember,
	getIndentString,
	getNewline,
	lineIndentOf,
} from './utils/index.js';

const MESSAGE_ID = 'prefer-type-module';
const SUGGESTION_ID = 'setModule';

const messages = {
	[MESSAGE_ID]: 'The `type` field should be `"module"`.',
	[SUGGESTION_ID]: 'Set `"type": "module"`.',
};

/** @param {import('eslint').Rule.RuleContext} context */
const create = context => {
	const {sourceCode} = context;

	return {
		Document(node) {
			const root = getRootObject(node);

			if (!root) {
				return;
			}

			const type = findMember(root, 'type');

			if (type && (type.value.type !== 'String' || type.value.value !== 'commonjs')) {
				return;
			}

			context.report({
				node: type?.value ?? root,
				messageId: MESSAGE_ID,
				suggest: [
					{
						messageId: SUGGESTION_ID,
						fix(fixer) {
							if (type) {
								return fixer.replaceText(type.value, '"module"');
							}

							const lastMember = root.members.at(-1);
							const isMultiline = sourceCode.getText(root).includes('\n');

							if (!lastMember) {
								if (!isMultiline) {
									return fixer.replaceText(root, '{"type": "module"}');
								}

								const indent = lineIndentOf(sourceCode, root) + getIndentString(sourceCode);
								return fixer.insertTextAfterRange([root.range[0], root.range[0] + 1], `${getNewline(sourceCode)}${indent}"type": "module"`);
							}

							const separator = isMultiline ? getNewline(sourceCode) + lineIndentOf(sourceCode, lastMember) : ' ';
							return fixer.insertTextAfter(lastMember, `,${separator}"type": "module"`);
						},
					},
				],
			});
		},
	};
};

/** @type {import('eslint').Rule.RuleModule} */
const config = {
	create,
	meta: {
		type: 'suggestion',
		docs: {
			description: 'Prefer the `type` field to be `module`.',
			recommended: true,
		},
		hasSuggestions: true,
		schema: [],
		messages,
		languages: ['json/json'],
	},
};

export default config;
