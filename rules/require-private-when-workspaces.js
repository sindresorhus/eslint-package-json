import {
	getRootObject,
	findMember,
	getIndentString,
	getNewline,
} from './utils/index.js';

const MESSAGE_ID = 'require-private-when-workspaces';
const SUGGESTION_ID = 'setPrivate';

const messages = {
	[MESSAGE_ID]: 'A package with `workspaces` should set `"private": true` to avoid accidentally publishing the workspace root.',
	[SUGGESTION_ID]: 'Set `"private": true`.',
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

			const workspaces = findMember(root, 'workspaces');

			if (!workspaces) {
				return;
			}

			const privateMember = findMember(root, 'private');

			if (
				privateMember?.value.type === 'Boolean'
				&& privateMember.value.value === true
			) {
				return;
			}

			context.report({
				node: workspaces.name,
				messageId: MESSAGE_ID,
				suggest: [
					{
						messageId: SUGGESTION_ID,
						fix(fixer) {
							// Replace an existing falsy `private`, otherwise append a new member. `sort-properties` handles final placement.
							if (privateMember) {
								return fixer.replaceText(privateMember.value, 'true');
							}

							const lastMember = root.members.at(-1);
							const indent = getIndentString(sourceCode);
							const newline = getNewline(sourceCode);

							return fixer.insertTextAfter(lastMember, `,${newline}${indent}"private": true`);
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
			description: 'Require `private` when `workspaces` is set.',
			recommended: true,
		},
		hasSuggestions: true,
		schema: [],
		messages,
		languages: ['json/json'],
	},
};

export default config;
