import {
	getRootObject,
	findMember,
	removeMemberAndDuplicates,
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
	// The option schema marks the list `uniqueItems`, but a name and a `{field}` object for the same field are not equal items, so both survive validation and both resolve to the same field. One field is one report, so the entries are keyed by name, and an entry with a custom message wins over one without, so the message the author wrote is never dropped for the default. `no-restricted-dependencies` resolves the same misconfiguration the same way, so the two rules agree.
	const restrictedFields = new Map();

	for (const field of fields) {
		const entry = normalizeEntry(field);

		if (entry.message || !restrictedFields.get(entry.field)?.message) {
			restrictedFields.set(entry.field, entry);
		}
	}

	return {
		Document(node) {
			const root = getRootObject(node);

			if (!root) {
				return;
			}

			for (const [field, entry] of restrictedFields) {
				const member = findMember(root, field);

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
								yield * removeMemberAndDuplicates(fixer, sourceCode, member);
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
