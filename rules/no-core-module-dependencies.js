import {builtinModules} from 'node:module';
import {
	getRootObject,
	iterateDependencies,
	optionsSchema,
	stringArraySchema,
	removeMember,
} from './utils/index.js';

const MESSAGE_ID = 'no-core-module-dependencies';
const SUGGESTION_ID = 'remove';

const messages = {
	[MESSAGE_ID]: 'Dependency `{{name}}` is a Node.js built-in module; this is usually accidental or a stale polyfill.',
	[SUGGESTION_ID]: 'Remove the dependency.',
};

const builtins = new Set(builtinModules);

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

			for (const {member, name} of iterateDependencies(root)) {
				if (builtins.has(name) && !ignore.includes(name)) {
					context.report({
						node: member.name,
						messageId: MESSAGE_ID,
						data: {name},
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
