import {builtinModules} from 'node:module';
import {
	getRootObject,
	iterateDependencies,
	optionsSchema,
	stringArraySchema,
	removeEntryAndEmptyContainer,
} from './utils/index.js';

const MESSAGE_ID = 'no-core-module-dependencies';
const SUGGESTION_ID = 'remove';

const messages = {
	[MESSAGE_ID]: 'Dependency `{{name}}` is a Node.js built-in module; this is usually accidental or a stale polyfill.',
	[SUGGESTION_ID]: 'Remove the dependency.',
};

// These core names are also maintained userland packages that code depends on on purpose: it imports them with a trailing slash to skip the built-in (`require('punycode/')` in `tr46`, `require('string_decoder/')` in `readable-stream`, `require('util/')` in `assert`), or bundlers install them as the browser polyfill for the built-in (the same-name entries of `node-libs-browser`). Removing one breaks the code that needs it.
const userlandPackages = new Set(['assert', 'buffer', 'events', 'process', 'punycode', 'string_decoder', 'url', 'util']);

const builtins = new Set(builtinModules.filter(name => !userlandPackages.has(name)));

/** @param {import('eslint').Rule.RuleContext} context */
const create = context => {
	const {ignore = []} = context.options[0] ?? {};
	const {sourceCode} = context;

	return {
		Document(node) {
			const root = getRootObject(node);

			if (!root) {
				return;
			}

			for (const {group, member, name} of iterateDependencies(root)) {
				if (builtins.has(name) && !ignore.includes(name)) {
					context.report({
						node: member.name,
						messageId: MESSAGE_ID,
						data: {name},
						suggest: [
							{
								messageId: SUGGESTION_ID,
								* fix(fixer) {
									yield * removeEntryAndEmptyContainer(fixer, sourceCode, group, member);
								},
							},
						],
					});
				}
			}
		},
	};
};

/** @type {import('eslint').Rule.RuleModule} */
const config = {
	create,
	meta: {
		type: 'suggestion',
		docs: {
			description: 'Disallow dependencies that shadow Node.js built-in modules.',
			recommended: true,
		},
		hasSuggestions: true,
		schema: optionsSchema({ignore: stringArraySchema}),
		messages,
		languages: ['json/json'],
	},
};

export default config;
