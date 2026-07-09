import {
	getRootObject,
	findMember,
	getKey,
	removeMember,
} from './utils/index.js';

const MESSAGE_ID = 'no-install-scripts';
const SUGGESTION_ID = 'remove';

const messages = {
	[MESSAGE_ID]: 'The `{{script}}` install script runs automatically on install and is a supply-chain risk.',
	[SUGGESTION_ID]: 'Remove the `{{script}}` script.',
};

const installScripts = ['preinstall', 'install', 'postinstall'];

/** @param {import('eslint').Rule.RuleContext} context */
const create = context => ({
	Document(node) {
		const root = getRootObject(node);

		if (!root) {
			return;
		}

		const scripts = findMember(root, 'scripts');

		if (scripts?.value.type !== 'Object') {
			return;
		}

		const {sourceCode} = context;

		for (const script of installScripts) {
			const member = findMember(scripts.value, script);

			if (!member) {
				continue;
			}

			context.report({
				node: member.name,
				messageId: MESSAGE_ID,
				data: {script: getKey(member)},
				suggest: [
					{
						messageId: SUGGESTION_ID,
						data: {script: getKey(member)},
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
		type: 'problem',
		docs: {
			description: 'Disallow `install` lifecycle scripts.',
			recommended: true,
		},
		hasSuggestions: true,
		schema: [],
		messages,
		languages: ['json/json'],
	},
};

export default config;
