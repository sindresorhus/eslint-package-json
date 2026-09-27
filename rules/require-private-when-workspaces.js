import {
	getRootObject,
	findMember,
	isPrivatePackage,
	setPrivate,
} from './utils/index.js';

const MESSAGE_ID = 'require-private-when-workspaces';
const SUGGESTION_ID = 'setPrivate';

const messages = {
	[MESSAGE_ID]: 'A package with `workspaces` should set `"private": true` to avoid accidentally publishing the workspace root.',
	[SUGGESTION_ID]: 'Set `"private": true`.',
};

/**
Check whether a `workspaces` field is an empty list, either directly or as the `packages` of the object form. It declares no workspace, so the package is not a monorepo root. Any other shape is reported, since a shape npm does not accept is a broken manifest either way.
*/
const isEmptyWorkspaces = workspaces => {
	const declaration = workspaces.value.type === 'Object' ? findMember(workspaces.value, 'packages')?.value : workspaces.value;
	return declaration?.type === 'Array' && declaration.elements.length === 0;
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

			if (!workspaces || isEmptyWorkspaces(workspaces)) {
				return;
			}

			const privateMember = findMember(root, 'private');

			if (isPrivatePackage(root)) {
				return;
			}

			context.report({
				node: workspaces.name,
				messageId: MESSAGE_ID,
				suggest: [
					{
						messageId: SUGGESTION_ID,
						* fix(fixer) {
							yield * setPrivate(fixer, sourceCode, root, privateMember);
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
