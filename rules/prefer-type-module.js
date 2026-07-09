import {
	getRootObject,
	findMember,
	getIndentString,
	getNewline,
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

			// A present but non-string `type` is malformed; leave it to `valid-fields`.
			if (type && type.value.type !== 'String') {
				return;
			}

			if (type?.value.value === 'module') {
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

							if (!lastMember) {
								return fixer.replaceText(root, '{"type": "module"}');
							}

							const indent = getIndentString(sourceCode);
							const newline = getNewline(sourceCode);

							return fixer.insertTextAfter(lastMember, `,${newline}${indent}"type": "module"`);
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
			description: 'Enforce the `type` field to be `module`.',
			recommended: true,
		},
		hasSuggestions: true,
		schema: [],
		messages,
		languages: ['json/json'],
	},
};

export default config;
