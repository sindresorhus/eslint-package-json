import process from 'node:process';
import {getRootObject, iterateExistingBinFiles} from './utils/index.js';

const MESSAGE_ID = 'invalid';
const STRING_MESSAGE_ID = 'invalidString';

const messages = {
	[MESSAGE_ID]: 'The `bin` file for `{{name}}` must have executable permission.',
	[STRING_MESSAGE_ID]: 'The `bin` file must have executable permission.',
};

const executePermissionMask = 0o111;

/** @param {import('eslint').Rule.RuleContext} context */
const create = context => ({
	Document(node) {
		if (process.platform === 'win32') {
			return;
		}

		const root = getRootObject(node);

		if (!root) {
			return;
		}

		for (const entry of iterateExistingBinFiles(context, root)) {
			// eslint-disable-next-line no-bitwise -- Unix permissions are a bitmask.
			if ((entry.mode & executePermissionMask) !== 0) {
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
			description: 'Require `bin` files to have Unix executable permission.',
			recommended: true,
		},
		schema: [],
		messages,
		languages: ['json/json'],
	},
};

export default config;
