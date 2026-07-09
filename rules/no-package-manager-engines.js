import {
	getRootObject,
	findMember,
	getKey,
	removeMember,
} from './utils/index.js';

const MESSAGE_ID = 'no-package-manager-engines';
const SUGGESTION_ID = 'remove';

const messages = {
	[MESSAGE_ID]: 'Specify the `{{manager}}` version in the `packageManager` field (with Corepack) instead of `engines`.',
	[SUGGESTION_ID]: 'Remove the engine.',
};

const packageManagers = new Set(['npm', 'yarn', 'pnpm', 'bun']);

/** @param {import('eslint').Rule.RuleContext} context */
const create = context => ({
	Document(node) {
		const root = getRootObject(node);

		if (!root) {
			return;
		}

		const engines = findMember(root, 'engines');

		if (engines?.value.type !== 'Object') {
			return;
		}

		const {sourceCode} = context;

		for (const member of engines.value.members) {
			const manager = getKey(member);

			if (!packageManagers.has(manager)) {
				continue;
			}

			context.report({
				node: member.name,
				messageId: MESSAGE_ID,
				data: {manager},
				suggest: [
					{
						messageId: SUGGESTION_ID,
						* fix(fixer) {
							yield * removeMember(fixer, sourceCode, member);
						},
					},
				],
			});
		}
	},
});

/** @type {import('eslint').Rule.RuleModule} */
const config = {
	create,
	meta: {
		type: 'suggestion',
		docs: {
			description: 'Disallow package manager versions in the `engines` field.',
			recommended: true,
		},
		hasSuggestions: true,
		schema: [],
		messages,
		languages: ['json/json'],
	},
};

export default config;
