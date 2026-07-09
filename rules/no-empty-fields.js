import {
	getRootObject,
	getKey,
	removeMember,
	optionsSchema,
	stringArraySchema,
} from './utils/index.js';

const MESSAGE_ID = 'no-empty-fields';
const SUGGESTION_ID = 'remove';

const messages = {
	[MESSAGE_ID]: 'Unexpected empty `{{key}}` field.',
	[SUGGESTION_ID]: 'Remove the empty field.',
};

const isEmptyValue = node => {
	switch (node.type) {
		case 'Object': {
			return node.members.length === 0;
		}

		case 'Array': {
			return node.elements.length === 0;
		}

		case 'String': {
			return node.value === '';
		}

		default: {
			return false;
		}
	}
};

/** @param {import('eslint').Rule.RuleContext} context */
const create = context => {
	const {ignore = []} = context.options[0] ?? {};
	const ignored = new Set(ignore);
	const {sourceCode} = context;

	return {
		Document(node) {
			const root = getRootObject(node);

			if (!root) {
				return;
			}

			for (const member of root.members) {
				const key = getKey(member);

				if (ignored.has(key) || !isEmptyValue(member.value)) {
					continue;
				}

				context.report({
					node: member,
					messageId: MESSAGE_ID,
					data: {key},
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
			description: 'Disallow empty fields.',
			recommended: true,
		},
		hasSuggestions: true,
		schema: optionsSchema({ignore: stringArraySchema}),
		messages,
		languages: ['json/json'],
	},
};

export default config;
