import {
	getRootObject,
	iterateDependencies,
	removeMember,
	optionsSchema,
	stringArraySchema,
} from './utils/index.js';

const MESSAGE_ID = 'no-orphan-types';
const SUGGESTION_ID = 'remove';

const messages = {
	[MESSAGE_ID]: '`{{name}}` has no corresponding `{{target}}` dependency; the type package is unused.',
	[SUGGESTION_ID]: 'Remove the unused type package.',
};

// Ambient type packages that have no runtime counterpart.
const defaultIgnore = ['@types/node', '@types/bun'];

/**
Map an `@types/*` package name to the runtime package it provides types for.

`@types/foo` → `foo`; `@types/foo__bar` → `@foo/bar` (the scoped-types convention).
*/
const typesTarget = name => {
	const subject = name.slice('@types/'.length);

	return subject.includes('__') ? '@' + subject.replace('__', '/') : subject;
};

/** @param {import('eslint').Rule.RuleContext} context */
const create = context => {
	const ignore = new Set([...defaultIgnore, ...(context.options[0]?.ignore ?? [])]);
	const {sourceCode} = context;

	return {
		Document(node) {
			const root = getRootObject(node);

			if (!root) {
				return;
			}

			const allNames = new Set();
			const typeEntries = [];

			for (const {groupName, member, name} of iterateDependencies(root)) {
				allNames.add(name);

				if (
					name.startsWith('@types/')
					&& (groupName === 'dependencies' || groupName === 'devDependencies')
				) {
					typeEntries.push({member, name});
				}
			}

			for (const {member, name} of typeEntries) {
				if (ignore.has(name)) {
					continue;
				}

				const target = typesTarget(name);

				if (allNames.has(target)) {
					continue;
				}

				context.report({
					node: member.name,
					messageId: MESSAGE_ID,
					data: {name, target},
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
	};
};

/** @type {import('eslint').Rule.RuleModule} */
const config = {
	create,
	meta: {
		type: 'suggestion',
		docs: {
			description: 'Disallow `@types/*` packages without a corresponding dependency.',
			recommended: true,
		},
		hasSuggestions: true,
		schema: optionsSchema({ignore: stringArraySchema}),
		messages,
		languages: ['json/json'],
	},
};

export default config;
