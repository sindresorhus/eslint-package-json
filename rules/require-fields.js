import {
	getRootObject,
	findMember,
	isPrivatePackage,
	optionsSchema,
} from './utils/index.js';

const MESSAGE_ID = 'require-fields';
const MESSAGE_ID_WHEN_PUBLIC = 'require-fields-when-public';

const messages = {
	[MESSAGE_ID]: 'Missing required field `{{field}}`.',
	[MESSAGE_ID_WHEN_PUBLIC]: 'A published package should declare `{{field}}`.',
};

// The rule has no fix, so a name no manifest can carry would be an error nothing can ever resolve. A schema that
// rejects it says so in the configuration instead.
const fieldNameSchema = {
	type: 'array',
	items: {
		type: 'string',
		minLength: 1,
		// Whitespace is not a name any manifest can spell either, and one reads as a mistake rather than one.
		pattern: String.raw`\S`,
	},
	uniqueItems: true,
};

/** @param {import('eslint').Rule.RuleContext} context */
const create = context => {
	const {
		fields = [],
		fieldsWhenPublic = ['name', 'version', 'description', 'license', 'keywords'],
	} = context.options[0] ?? {};
	const requiredFields = new Set(fields);

	return {
		Document(node) {
			const root = getRootObject(node);

			if (!root) {
				return;
			}

			for (const field of fields) {
				if (findMember(root, field)) {
					continue;
				}

				context.report({
					node: root,
					messageId: MESSAGE_ID,
					data: {field},
				});
			}

			if (isPrivatePackage(root)) {
				return;
			}

			for (const field of fieldsWhenPublic) {
				if (requiredFields.has(field) || findMember(root, field)) {
					continue;
				}

				context.report({
					node: root,
					messageId: MESSAGE_ID_WHEN_PUBLIC,
					data: {field},
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
			description: 'Require specific fields to be present, always or only for published packages.',
			recommended: true,
		},
		schema: optionsSchema({
			fields: fieldNameSchema,
			fieldsWhenPublic: fieldNameSchema,
		}),
		messages,
		languages: ['json/json'],
	},
};

export default config;
