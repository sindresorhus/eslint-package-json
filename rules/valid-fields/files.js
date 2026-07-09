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

// Paths npm never publishes, so listing them in `files` is pointless.
const alwaysIgnored = new Set([
	'node_modules',
	'.git',
	'.hg',
	'.svn',
	'.npmrc',
	'package-lock.json',
	'yarn.lock',
	'pnpm-lock.yaml',
	'bun.lockb',
	'bun.lock',
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

		// Compare the leading path segment so `node_modules/foo` is caught too.
		const segment = value.replace(/^\.\//, '').split('/', 1)[0];

		if (alwaysIgnored.has(segment)) {
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
