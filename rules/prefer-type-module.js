import {getRootObject, findMember} from './utils/index.js';

const MESSAGE_ID = 'prefer-type-module';
const SUGGESTION_ID = 'setModule';

const messages = {
	[MESSAGE_ID]: 'The `type` field should be `"module"` instead of `"commonjs"`.',
	[SUGGESTION_ID]: 'Set `"type": "module"`.',
};

/** @param {import('eslint').Rule.RuleContext} context */
const create = context => ({
	Document(node) {
		const root = getRootObject(node);

		if (!root) {
			return;
		}

		const type = findMember(root, 'type');

		if (type?.value.type !== 'String' || type.value.value !== 'commonjs') {
			return;
		}

		context.report({
			node: type.value,
			messageId: MESSAGE_ID,
			suggest: [
				{
					messageId: SUGGESTION_ID,
					fix: fixer => fixer.replaceText(type.value, '"module"'),
				},
			],
		});
	},
});

/** @type {import('eslint').Rule.RuleModule} */
const config = {
	create,
	meta: {
		type: 'suggestion',
		docs: {
			description: 'Prefer the `type` field to be `module`.',
			recommended: false,
		},
		hasSuggestions: true,
		schema: [],
		messages,
		languages: ['json/json'],
	},
};

export default config;
