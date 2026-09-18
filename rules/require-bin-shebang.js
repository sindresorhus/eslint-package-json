import fs from 'node:fs';
import path from 'node:path';
import {getRootObject, iterateExistingBinFiles} from './utils/index.js';

const MESSAGE_ID = 'invalid';
const STRING_MESSAGE_ID = 'invalidString';

const messages = {
	[MESSAGE_ID]: 'The `bin` file for `{{name}}` must start with a `#!/usr/bin/env node` shebang.',
	[STRING_MESSAGE_ID]: 'The `bin` file must start with a `#!/usr/bin/env node` shebang.',
};

const supportedExtensions = new Set(['.js', '.mjs', '.cjs']);
// `-S` splits the rest of the line into separate arguments, which is what makes `node --flag` work on Linux.
const nodeShebangPattern = /^#!\/usr\/bin\/env (?:-S )?node(?: |\n|$)/u;

/** @param {import('eslint').Rule.RuleContext} context */
const create = context => ({
	Document(node) {
		const root = getRootObject(node);

		if (!root) {
			return;
		}

		for (const entry of iterateExistingBinFiles(context, root)) {
			const extension = path.extname(entry.value);

			if (!supportedExtensions.has(extension)) {
				continue;
			}

			let content;

			try {
				content = fs.readFileSync(entry.filePath, 'utf8');
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
			description: 'Require `bin` files to start with a `#!/usr/bin/env node` shebang.',
			recommended: true,
		},
		schema: [],
		messages,
		languages: ['json/json'],
	},
};

export default config;
