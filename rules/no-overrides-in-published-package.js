import {
	getRootObject,
	findMember,
	isPrivatePackage,
	removeMember,
} from './utils/index.js';

const MESSAGE_ID = 'no-overrides-in-published-package';
const SUGGESTION_ID = 'remove';

const messages = {
	[MESSAGE_ID]: 'The `overrides` field is ignored when this package is installed as a dependency.',
	[SUGGESTION_ID]: 'Remove the `overrides` field.',
};

/** @param {import('eslint').Rule.RuleContext} context */
const create = context => ({
	Document(node) {
		const root = getRootObject(node);

		if (!root) {
			return;
		}

		if (isPrivatePackage(root)) {
			return;
		}

		const overrides = findMember(root, 'overrides');

		if (!overrides) {
			return;
		}

		const {sourceCode} = context;

		context.report({
			node: overrides.name,
			messageId: MESSAGE_ID,
			suggest: [
				{
					messageId: SUGGESTION_ID,
					* fix(fixer) {
						yield * removeMember(fixer, sourceCode, overrides);
					},
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
			description: 'Disallow `overrides` in packages that can be published.',
			recommended: true,
		},
		hasSuggestions: true,
		schema: [],
		messages,
		languages: ['json/json'],
	},
};

export default config;
