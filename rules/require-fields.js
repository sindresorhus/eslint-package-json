import {
	getRootObject,
	findMember,
	isPrivatePackage,
	optionsSchema,
	stringArraySchema,
} from './utils/index.js';

const MESSAGE_ID = 'require-fields';
const MESSAGE_ID_WHEN_PUBLIC = 'require-fields-when-public';

const messages = {
	[MESSAGE_ID]: 'Missing required field `{{field}}`.',
	[MESSAGE_ID_WHEN_PUBLIC]: 'A published package should declare `{{field}}`.',
};

/** @param {import('eslint').Rule.RuleContext} context */
const create = context => {
	const {
		fields = ['name', 'version'],
		fieldsWhenPublic = ['license', 'keywords', 'description'],
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
			fields: stringArraySchema,
			fieldsWhenPublic: stringArraySchema,
		}),
		messages,
		languages: ['json/json'],
	},
};

export default config;
