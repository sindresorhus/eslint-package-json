import {
	getRootObject,
	getKey,
	findMember,
	buildReorderedObject,
	isSameOrder,
} from './utils/index.js';

const MESSAGE_ID = 'sort-scripts';

const messages = {
	[MESSAGE_ID]: 'Script names should be sorted alphabetically.',
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
			const {members} = scripts;

			if (members.length === 0) {
				return;
			}

			const sortedMembers = members.toSorted((a, b) =>
				getKey(a).localeCompare(getKey(b)));

			if (isSameOrder(members, sortedMembers)) {
				return;
			}

			context.report({
				node: scripts,
				messageId: MESSAGE_ID,
				fix: fixer => fixer.replaceText(
					scripts,
					buildReorderedObject(sourceCode, scripts, sortedMembers),
				),
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
		fixable: 'code',
		schema: [],
		messages,
		languages: ['json/json'],
	},
};

export default config;
