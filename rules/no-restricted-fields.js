import {
	getRootObject,
	findMember,
	removeMember,
	optionsSchema,
} from './utils/index.js';

const MESSAGE_ID = 'restricted';
const SUGGESTION_ID = 'remove';

const messages = {
	[MESSAGE_ID]: '{{message}}',
	[SUGGESTION_ID]: 'Remove the field.',
};

/**
Normalize a fields option entry (a bare field name or a `{field, message}` object) to `{field, message}`.
*/
const normalizeEntry = entry => typeof entry === 'string' ? {field: entry} : entry;

/** @param {import('eslint').Rule.RuleContext} context */
const create = context => {
	const {fields = []} = context.options[0] ?? {};
	const {sourceCode} = context;
	const normalizedFields = fields.map(field => normalizeEntry(field));

	return {
		Document(node) {
			const root = getRootObject(node);

			if (!root) {
				return;
			}

			for (const entry of normalizedFields) {
				const member = findMember(root, entry.field);

				if (!member) {
					continue;
				}

				// Fall back to the default for both a missing and an empty custom message.
				const message = entry.message || `The \`${entry.field}\` field is not allowed.`;

				context.report({
					node: member.name,
					messageId: MESSAGE_ID,
					data: {message},
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
			description: 'Disallow specific fields.',
			recommended: false,
		},
		hasSuggestions: true,
		schema: optionsSchema({
			fields: {
				type: 'array',
				items: {
					oneOf: [
						{
							type: 'string',
						},
						{
							type: 'object',
							properties: {
								field: {
									type: 'string',
								},
								message: {
									type: 'string',
								},
							},
							required: ['field'],
							additionalProperties: false,
						},
					],
				},
				uniqueItems: true,
			},
		}),
		messages,
		languages: ['json/json'],
	},
};

export default config;
