import {findMember, removeElement} from '../utils/index.js';

const TYPE_MESSAGE_ID = 'type';
const ELEMENT_MESSAGE_ID = 'element';
const EMPTY_MESSAGE_ID = 'empty';
const IGNORED_MESSAGE_ID = 'ignored';

export const messages = {
	[TYPE_MESSAGE_ID]: 'The `files` field must be an array.',
	[ELEMENT_MESSAGE_ID]: 'Each `files` entry must be a string.',
	[EMPTY_MESSAGE_ID]: 'A `files` entry must not be empty.',
	[IGNORED_MESSAGE_ID]: '`{{value}}` is always ignored by npm and cannot be published.',
};

// The paths npm force-excludes from every tarball, so listing them in `files` is pointless. These are npm's `strict` rules, not its default ignores, so an explicit `files` entry cannot override them. The list follows npm 12, whose `npm-packlist` strict rules also cover `npm-shrinkwrap.json`, `bun.lock`, and the `.npm-extension` entry point, which `npm pack` confirms.
const alwaysIgnored = new Set([
	'node_modules',
	'package-lock.json',
	'npm-shrinkwrap.json',
	'yarn.lock',
	'pnpm-lock.yaml',
	'bun.lockb',
	'bun.lock',
	'.npm-extension.mjs',
	'.npm-extension.cjs',
]);

// Npm excludes these two with a `**/`-prefixed default rule, so they are ignored at any depth rather than only at the package root. Unlike the set above, a nested `node_modules` or lockfile is publishable, which `npm pack` confirms. The list is deliberately narrow: npm excludes more of its defaults at any depth (`.svn`, `.hg`, `CVS`, `.gitignore`, `.npmignore`, `.DS_Store`, `npm-debug.log`, `*.orig`) and a `files` entry rarely names one, so those are left alone rather than growing the set here. Nothing reports a `files` entry npm silently drops; `no-missing-files` reports one that matches no file at all.
const alwaysIgnoredAnywhere = new Set([
	'.git',
	'.npmrc',
]);

export function * check(root, context) {
	const {sourceCode} = context;

	const files = findMember(root, 'files');

	if (!files) {
		return;
	}

	if (files.value.type !== 'Array') {
		yield {
			node: files.value,
			messageId: TYPE_MESSAGE_ID,
		};
		return;
	}

	for (const element of files.value.elements) {
		if (element.value.type !== 'String') {
			yield {
				node: element.value,
				messageId: ELEMENT_MESSAGE_ID,
			};
			continue;
		}

		const {value} = element.value;

		if (value === '') {
			yield {
				node: element.value,
				messageId: EMPTY_MESSAGE_ID,
				* fix(fixer) {
					yield * removeElement(fixer, sourceCode, element);
				},
			};
			continue;
		}

		// Compare the leading path segment so `node_modules/foo` is caught too, and every segment for the any-depth set, so `sub/.npmrc` is caught as well. npm strips a leading `./` or `/` from an entry, so both name the same file. Npm's matcher runs with `nocase`, so a casing variant is excluded just as the name spelled its own way is.
		const segments = value.replace(/^\.?\//u, '').split('/').map(segment => segment.toLowerCase());

		if (alwaysIgnored.has(segments[0]) || segments.some(segment => alwaysIgnoredAnywhere.has(segment))) {
			yield {
				node: element.value,
				messageId: IGNORED_MESSAGE_ID,
				data: {value},
				* fix(fixer) {
					yield * removeElement(fixer, sourceCode, element);
				},
			};
		}
	}
}
