import {
	deprecatedFields,
	getRootObject,
	findMember,
	getKey,
} from './utils/index.js';

const FIELD_MESSAGE_ID = 'deprecatedField';
const SCRIPT_MESSAGE_ID = 'deprecatedScript';

const messages = {
	[FIELD_MESSAGE_ID]: 'The `{{field}}` field is deprecated. {{advice}}',
	[SCRIPT_MESSAGE_ID]: 'The `prepublish` script no longer runs on `npm publish`, but it still runs on `npm install`. Use `prepublishOnly` to run only on publish.',
};

/** @param {import('eslint').Rule.RuleContext} context */
const create = context => ({
	Document(node) {
		const root = getRootObject(node);

		if (!root) {
			return;
		}

		for (const member of root.members) {
			const field = getKey(member);
			const advice = deprecatedFields.get(field);

			if (advice) {
				context.report({
					node: member.name,
					messageId: FIELD_MESSAGE_ID,
					data: {field, advice},
				});
			}
		}

		const scripts = findMember(root, 'scripts');

		if (scripts?.value.type !== 'Object') {
			return;
		}

		const prepublish = findMember(scripts.value, 'prepublish');

		if (prepublish) {
			context.report({
				node: prepublish.name,
				messageId: SCRIPT_MESSAGE_ID,
			});
		}
	},
});

/** @type {import('eslint').Rule.RuleModule} */
const config = {
	create,
	meta: {
		type: 'problem',
		docs: {
			description: 'Disallow fields and scripts that npm has deprecated.',
			recommended: true,
		},
		schema: [],
		messages,
		languages: ['json/json'],
	},
};

export default config;
