import fs from 'node:fs';
import path from 'node:path';
import {findMember, getKey, getRootObject} from './utils/index.js';

const MESSAGE_ID = 'invalid';
const STRING_MESSAGE_ID = 'invalidString';

const messages = {
	[MESSAGE_ID]: 'The `bin` file for `{{name}}` must start with `#!/usr/bin/env node`.',
	[STRING_MESSAGE_ID]: 'The `bin` file must start with `#!/usr/bin/env node`.',
};

const supportedExtensions = new Set(['.js', '.mjs', '.cjs']);
const nodeShebangPattern = /^#!\/usr\/bin\/env node(?:\n|$)/u;

/**
Iterate the string-valued file paths referenced by `bin`.
*/
function * getBinEntries(binMember) {
	if (binMember.value.type === 'String') {
		yield {node: binMember.value, path: binMember.value.value};
		return;
	}

	if (binMember.value.type !== 'Object') {
		return;
	}

	for (const member of binMember.value.members) {
		if (member.value.type === 'String') {
			yield {node: member.value, path: member.value.value, name: getKey(member)};
		}
	}
}

/**
Check whether a resolved path stays within the package directory.
*/
function isWithinPackage(packageDirectory, filePath) {
	const relativePath = path.relative(packageDirectory, filePath);

	return relativePath !== ''
		&& relativePath !== '..'
		&& !relativePath.startsWith(`..${path.sep}`)
		&& !path.isAbsolute(relativePath);
}

/** @param {import('eslint').Rule.RuleContext} context */
const create = context => ({
	Document(node) {
		const root = getRootObject(node);

		if (!root) {
			return;
		}

		const binMember = findMember(root, 'bin');

		if (!binMember) {
			return;
		}

		const {physicalFilename} = context;

		if (physicalFilename.startsWith('<')) {
			return;
		}

		const packageDirectory = path.dirname(path.resolve(context.cwd, physicalFilename));
		let realPackageDirectory;

		try {
			realPackageDirectory = fs.realpathSync(packageDirectory);
		} catch {
			return;
		}

		for (const entry of getBinEntries(binMember)) {
			const extension = path.extname(entry.path);

			if (!supportedExtensions.has(extension)) {
				continue;
			}

			const filePath = path.resolve(packageDirectory, entry.path);

			if (!isWithinPackage(packageDirectory, filePath)) {
				continue;
			}

			let realFilePath;

			try {
				if (!fs.statSync(filePath).isFile()) {
					continue;
				}

				realFilePath = fs.realpathSync(filePath);
			} catch {
				continue;
			}

			if (!isWithinPackage(realPackageDirectory, realFilePath)) {
				continue;
			}

			let content;

			try {
				content = fs.readFileSync(realFilePath, 'utf8');
			} catch {
				continue;
			}

			if (nodeShebangPattern.test(content)) {
				continue;
			}

			context.report({
				node: entry.node,
				messageId: entry.name === undefined ? STRING_MESSAGE_ID : MESSAGE_ID,
				...(entry.name !== undefined && {data: {name: entry.name}}),
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
			description: 'Require `bin` files to start with a Node.js shebang.',
			recommended: true,
		},
		schema: [],
		messages,
		languages: ['json/json'],
	},
};

export default config;
