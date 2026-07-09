import {
	getRootObject,
	findMember,
	removeElement,
	hasGlob,
} from './utils/index.js';

const MESSAGE_ID_DEFAULT = 'default';
const MESSAGE_ID_DUPLICATE = 'duplicate';

const messages = {
	[MESSAGE_ID_DEFAULT]: '`{{value}}` is always included by npm and is redundant in `files`.',
	[MESSAGE_ID_DUPLICATE]: '`{{value}}` is a duplicate entry in `files`.',
};

// Patterns for files npm always includes.
const ALWAYS_INCLUDED_PATTERNS = [
	/^(\.\/)?package\.json$/i,
	/^(\.\/)?readme(\.|$)/i,
	/^(\.\/)?licen[cs]e(\.|$)/i,
];

/**
Check if a file path matches any always-included pattern.
*/
function isAlwaysIncluded(value) {
	return ALWAYS_INCLUDED_PATTERNS.some(pattern => pattern.test(value));
}

/** @param {import('eslint').Rule.RuleContext} context */
const create = context => ({
	Document(node) {
		const root = getRootObject(node);

		if (!root) {
			return;
		}

		const filesMember = findMember(root, 'files');

		if (!filesMember || filesMember.value.type !== 'Array') {
			return;
		}

		const {sourceCode} = context;
		const seen = new Set();

		for (const element of filesMember.value.elements) {
			const valueNode = element.value;

			if (valueNode.type !== 'String') {
				continue;
			}

			const {value} = valueNode;

			// Check for exact duplicates (always, even for glob patterns).
			if (seen.has(value)) {
				context.report({
					node: valueNode,
					messageId: MESSAGE_ID_DUPLICATE,
					data: {value},
					* fix(fixer) {
						yield * removeElement(fixer, sourceCode, element);
					},
				});
				continue;
			}

			seen.add(value);

			// Skip glob patterns for always-included check.
			if (hasGlob(value)) {
				continue;
			}

			if (isAlwaysIncluded(value)) {
				context.report({
					node: valueNode,
					messageId: MESSAGE_ID_DEFAULT,
					data: {value},
					* fix(fixer) {
						yield * removeElement(fixer, sourceCode, element);
					},
				});
			}
		}
	},
});

/** @type {import('eslint').Rule.RuleModule} */
const config = {
	create,
	meta: {
		type: 'suggestion',
		docs: {
			description: 'Disallow redundant entries in the `files` field.',
			recommended: true,
		},
		fixable: 'code',
		schema: [],
		messages,
		languages: ['json/json'],
	},
};

export default config;
