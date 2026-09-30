import {
	getRootObject,
	findMember,
	iterateDependencies,
	removeEntryAndEmptyContainer,
	optionsSchema,
	stringArraySchema,
} from './utils/index.js';

const MESSAGE_ID = 'no-orphan-types';
const SUGGESTION_ID = 'remove';

const messages = {
	[MESSAGE_ID]: '`{{name}}` has no corresponding `{{target}}` dependency, which usually means the type package is dead weight.',
	[SUGGESTION_ID]: 'Remove the type package.',
};

// Ambient type packages that have no runtime counterpart.
const defaultIgnore = [
	'@types/node',
	'@types/bun',
	'@types/chrome',
	'@types/deno',
	'@types/firefox-webext-browser',
	'@types/google-apps-script',
	'@types/serviceworker',
	'@types/cordova',
	'@types/trusted-types',
	'@types/web-bluetooth',
	'@types/webxr',
	'@types/w3c-web-usb',
	'@types/w3c-web-hid',
	'@types/w3c-web-serial',
	'@types/w3c-image-capture',
	'@types/webgl-ext',
	// Type packages for a widely used AST format. Consumers normally get the format from an implementation package such as `mdast-util-from-markdown` or `rehype` rather than one named after the format, so a missing same-named dependency says nothing about whether the types are used. `@types/unist` is the canonical source: the `unist` package is deprecated in its favour, and `xast` is an unrelated library that happens to share the name.
	'@types/estree',
	'@types/estree-jsx',
	'@types/hast',
	'@types/mdast',
	'@types/unist',
	'@types/xast',
];

/**
Get the runtime package name for an `@types/*` package.

`@types/foo` → `foo`; `@types/foo__bar` → `@foo/bar` (the scoped-types convention).
*/
const getTypesTarget = name => {
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

			for (const {group, groupName, member, name} of iterateDependencies(root)) {
				allNames.add(name);

				if (
					name.startsWith('@types/')
					&& (groupName === 'dependencies' || groupName === 'devDependencies')
				) {
					typeEntries.push({group, member, name});
				}
			}

			// A manifest that is itself a type package declares the types its own declaration file imports, and a consumer receives those from `dependencies` alone, so they are its public API rather than an orphan. `@types/debug` depends on `@types/ms` for exactly this reason.
			const ownName = findMember(root, 'name');
			const isTypePackage = ownName?.value.type === 'String' && ownName.value.value.startsWith('@types/');

			if (isTypePackage) {
				return;
			}

			for (const {group, member, name} of typeEntries) {
				const target = getTypesTarget(name);

				if (ignore.has(name) || ignore.has(target)) {
					continue;
				}

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
								yield * removeEntryAndEmptyContainer(fixer, sourceCode, group, member);
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
