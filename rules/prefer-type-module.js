import {
	getRootObject,
	findMember,
	insertRootField,
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

							return insertRootField(fixer, sourceCode, root, {key: 'type', value: '"module"'});
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
