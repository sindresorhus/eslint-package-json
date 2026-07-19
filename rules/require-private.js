import {
	getRootObject,
	findMember,
	isPrivatePackage,
	setPrivate,
} from './utils/index.js';

const MESSAGE_ID = 'require-private';
const SUGGESTION_ID = 'setPrivate';

const messages = {
	[MESSAGE_ID]: 'The package must set `"private": true`.',
	[SUGGESTION_ID]: 'Set `"private": true`.',
};

/** @param {import('eslint').Rule.RuleContext} context */
const create = context => ({
	Document(node) {
		const root = getRootObject(node);

		if (!root) {
			return;
		}

		const privateMember = findMember(root, 'private');

		if (isPrivatePackage(root)) {
			return;
		}

		context.report({
			node: privateMember?.value ?? root,
			messageId: MESSAGE_ID,
			suggest: [
				{
					messageId: SUGGESTION_ID,
					* fix(fixer) {
						yield * setPrivate(fixer, context.sourceCode, root, privateMember);
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
			description: 'Require the `private` field to be `true`.',
			recommended: false,
		},
		hasSuggestions: true,
		schema: [],
		messages,
		languages: ['json/json'],
	},
};

export default config;
