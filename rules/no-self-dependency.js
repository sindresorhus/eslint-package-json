import {
	getRootObject,
	findMember,
	iterateDependencies,
	removeMember,
} from './utils/index.js';

const MESSAGE_ID = 'no-self-dependency';
const SUGGESTION_ID = 'remove';

const messages = {
	[MESSAGE_ID]: 'A package cannot list itself (`{{name}}`) as a dependency.',
	[SUGGESTION_ID]: 'Remove the self-dependency.',
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

			const nameMember = findMember(root, 'name');

			if (nameMember?.value.type !== 'String') {
				return;
			}

			const packageName = nameMember.value.value;

			for (const {member, name} of iterateDependencies(root)) {
				if (name !== packageName) {
					continue;
				}

				context.report({
					node: member.name,
					messageId: MESSAGE_ID,
					data: {name},
					suggest: [
						{
							messageId: SUGGESTION_ID,
							* fix(fixer) {
								yield * removeMember(fixer, sourceCode, member);
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
		type: 'problem',
		docs: {
			description: 'Disallow a package depending on itself.',
			recommended: true,
		},
		hasSuggestions: true,
		schema: [],
		messages,
		languages: ['json/json'],
	},
};

export default config;
