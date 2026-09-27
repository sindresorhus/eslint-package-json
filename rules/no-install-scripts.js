import {
	getRootObject,
	findMember,
	getKey,
	isPrivatePackage,
	removeEntryAndEmptyContainer,
} from './utils/index.js';

const MESSAGE_ID = 'no-install-scripts';
const SUGGESTION_ID = 'remove';

const messages = {
	[MESSAGE_ID]: 'The `{{script}}` install script runs automatically on install and is a supply-chain risk.',
	[SUGGESTION_ID]: 'Remove the `{{script}}` script.',
};

// The scripts npm runs when a package is installed from the registry as a dependency, which is what a consumer's machine runs: `@npmcli/arborist` rebuilds a package by running exactly these.
//
// `prepare` is not one of them. Arborist runs it only for a linked package, and a registry install never does. It also runs on `npm pack`, `npm publish` and a root `npm install`, but that is the author's own machine. Installing a git dependency does run it on a consumer's machine (pacote prepares the clone with a full `npm install`, which runs `preprepare`, `prepare` and `postprepare` too), but npm 12 refuses git dependencies by default (`allow-git` is `none`). Reporting it would flag the many packages that build or set up hooks in `prepare` for a path npm no longer takes.
//
// A `"private": true` package is never published, so it has no consumers and its install scripts run only on the author's machine, like a workspace root's `postinstall` that sets up hooks.
const installScripts = ['preinstall', 'install', 'postinstall'];

/** @param {import('eslint').Rule.RuleContext} context */
const create = context => ({
	Document(node) {
		const root = getRootObject(node);

		if (!root || isPrivatePackage(root)) {
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
							yield * removeEntryAndEmptyContainer(fixer, sourceCode, scripts, member);
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
