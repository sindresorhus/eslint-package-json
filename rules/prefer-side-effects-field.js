import {
	getRootObject,
	findMember,
	insertRootField,
} from './utils/index.js';

const MESSAGE_ID = 'prefer-side-effects-field';
const FALSE_SUGGESTION_ID = 'setFalse';
const TRUE_SUGGESTION_ID = 'setTrue';

const messages = {
	[MESSAGE_ID]: 'Declare a `sideEffects` field to describe import-time side effects.',
	[FALSE_SUGGESTION_ID]: 'Add `"sideEffects": false`.',
	[TRUE_SUGGESTION_ID]: 'Add `"sideEffects": true`.',
};

/** @param {import('eslint').Rule.RuleContext} context */
const create = context => {
	const {sourceCode} = context;

	return {
		Document(node) {
			const root = getRootObject(node);

			if (!root || findMember(root, 'sideEffects') || !findMember(root, 'exports')) {
				return;
			}

			context.report({
				node: root,
				messageId: MESSAGE_ID,
				suggest: [
					{
						messageId: FALSE_SUGGESTION_ID,
						fix: fixer => insertRootField(fixer, sourceCode, root, {key: 'sideEffects', value: 'false'}),
					},
					{
						messageId: TRUE_SUGGESTION_ID,
						fix: fixer => insertRootField(fixer, sourceCode, root, {key: 'sideEffects', value: 'true'}),
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
			description: 'Recommend declaring the `sideEffects` field for packages.',
			recommended: true,
		},
		hasSuggestions: true,
		schema: [],
		messages,
		languages: ['json/json'],
	},
};

export default config;
