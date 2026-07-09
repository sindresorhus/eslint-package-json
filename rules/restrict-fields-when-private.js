import {
	getRootObject,
	findMember,
	isPrivatePackage,
	removeMember,
	optionsSchema,
	stringArraySchema,
} from './utils/index.js';

const MESSAGE_ID = 'restrict-fields-when-private';
const SUGGESTION_ID = 'remove';

const messages = {
	[MESSAGE_ID]: '`{{field}}` has no effect when the package is private.',
	[SUGGESTION_ID]: 'Remove the field.',
};

/** @param {import('eslint').Rule.RuleContext} context */
const create = context => {
	const {fields = ['publishConfig', 'files']} = context.options[0] ?? {};
	const {sourceCode} = context;

	return {
		Document(node) {
			const root = getRootObject(node);

			if (!root) {
				return;
			}

			if (!isPrivatePackage(root)) {
				return;
			}

			for (const field of fields) {
				const member = findMember(root, field);

				if (!member) {
					continue;
				}

				context.report({
					node: member.name,
					messageId: MESSAGE_ID,
					data: {field},
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
		type: 'suggestion',
		docs: {
			description: 'Disallow fields that have no effect when the package is private.',
			recommended: false,
		},
		hasSuggestions: true,
		schema: optionsSchema({fields: stringArraySchema}),
		messages,
		languages: ['json/json'],
	},
};

export default config;
