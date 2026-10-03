import {
	getRootObject,
	findMember,
	buildReordered,
	getSortedMembers,
} from './utils/index.js';

const MESSAGE_ID = 'sort-scripts';
const SUGGESTION_ID = 'sort';

const messages = {
	[MESSAGE_ID]: 'Script names should be sorted alphabetically.',
	[SUGGESTION_ID]: 'Sort the scripts alphabetically.',
};

/** @param {import('eslint').Rule.RuleContext} context */
const create = context => {
	const {sourceCode} = context;

	return {
		Document(node) {
			const root = getRootObject(node);

			if (!root) {
				return;
			}

			const scriptsMember = findMember(root, 'scripts');

			if (scriptsMember?.value.type !== 'Object') {
				return;
			}

			const scripts = scriptsMember.value;
			const sortedMembers = getSortedMembers(scripts);

			if (!sortedMembers) {
				return;
			}

			// A suggestion rather than a fix: npm-run-all's `run-s "build:*"` runs the matching scripts in the order they are written, so sorting them can change the order they run in.
			context.report({
				node: scripts,
				messageId: MESSAGE_ID,
				suggest: [
					{
						messageId: SUGGESTION_ID,
						fix: fixer => fixer.replaceText(
							scripts,
							buildReordered(sourceCode, scripts, sortedMembers),
						),
					},
				],
			});
		},
	};
};

/** @type {import('eslint').Rule.RuleModule} */
const config = {
	create,
	meta: {
		type: 'suggestion',
		docs: {
			description: 'Enforce alphabetical ordering of scripts.',
			recommended: false,
		},
		hasSuggestions: true,
		schema: [],
		messages,
		languages: ['json/json'],
	},
};

export default config;
