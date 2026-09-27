import fs from 'node:fs';
import {Buffer} from 'node:buffer';
import path from 'node:path';
import {getRootObject, iterateExistingBinFiles} from './utils/index.js';

const MESSAGE_ID = 'invalid';
const STRING_MESSAGE_ID = 'invalidString';
const LENGTH_MESSAGE_ID = 'tooLong';
const LENGTH_STRING_MESSAGE_ID = 'tooLongString';

const messages = {
	[MESSAGE_ID]: 'The `bin` file for `{{name}}` must start with a `#!/usr/bin/env node` shebang.',
	[STRING_MESSAGE_ID]: 'The `bin` file must start with a `#!/usr/bin/env node` shebang.',
	[LENGTH_MESSAGE_ID]: 'The `bin` file for `{{name}}` must have a shebang of at most 255 bytes; Linux truncates a longer one.',
	[LENGTH_STRING_MESSAGE_ID]: 'The `bin` file must have a shebang of at most 255 bytes; Linux truncates a longer one.',
};

const supportedExtensions = new Set(['.js', '.mjs', '.cjs']);
// The Linux kernel hands `env` the whole rest of the shebang line as a single argument, so `#!/usr/bin/env node --flag`
// runs `env 'node --flag'`, which exits 127: the flag becomes part of the program name. `-S` is what makes `env` split it.
// `env` splits its own argument on spaces and tabs and takes it glued on or after them, so every spacing of the plain and
// `-S` spellings runs `node`. A bare `node` must end the line, and a `\r` is not a separator, so a CRLF shebang fails too.
// The kernel skips spaces and tabs after `#!` and trims them before the newline (`fs/binfmt_script.c`), but a line with no newline is read out of a zero-padded buffer and keeps its trailing spaces, so `env` looks for a program named `node `.
const nodeShebangPattern = /^#![\t ]*\/usr\/bin\/env[\t ]+(?:-S[\t ]*node(?:[\t\n ]|$)|node(?:[\t ]*\n|$))/u;

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
				const newlineIndex = content.indexOf('\n');
				const shebang = content.slice(0, newlineIndex === -1 ? undefined : newlineIndex);

				// Linux reads a script into a 256-byte buffer and cuts a first line that does not fit at 255 bytes,
				// so the file runs with a mangled argument instead of the one it declares.
				if (Buffer.byteLength(shebang) <= 255) {
					continue;
				}

				context.report({
					node: entry.node,
					messageId: entry.name === undefined ? LENGTH_STRING_MESSAGE_ID : LENGTH_MESSAGE_ID,
					...(entry.name !== undefined && {data: {name: entry.name}}),
				});
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
