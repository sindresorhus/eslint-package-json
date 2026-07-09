import {getRootObject, findMember, optionsSchema} from './utils/index.js';

const MESSAGE_ID_UPPERCASE = 'uppercase';
const MESSAGE_ID_NO_PERIOD = 'noPeriod';
const MESSAGE_ID_PERIOD = 'period';

const messages = {
	[MESSAGE_ID_UPPERCASE]: 'Description should start with an uppercase letter.',
	[MESSAGE_ID_NO_PERIOD]: 'Description should not end with a period.',
	[MESSAGE_ID_PERIOD]: 'Description should end with a period.',
};

/** @param {import('eslint').Rule.RuleContext} context */
const create = context => {
	const {startWithUppercase = true, endWithPeriod = false} = context.options[0] ?? {};

	return {
		Document(node) {
			const root = getRootObject(node);

			if (!root) {
				return;
			}

			const member = findMember(root, 'description');

			if (member?.value.type !== 'String' || member.value.value === '') {
				return;
			}

			const description = member.value.value;

			if (startWithUppercase && /^[a-z]/u.test(description)) {
				const fixed = description[0].toUpperCase() + description.slice(1);

				context.report({
					node: member.value,
					messageId: MESSAGE_ID_UPPERCASE,
					fix: fixer => fixer.replaceText(member.value, JSON.stringify(fixed)),
				});
			}

			if (endWithPeriod === false && description.endsWith('.')) {
				const fixed = description.replace(/\.+$/u, '');

				context.report({
					node: member.value,
					messageId: MESSAGE_ID_NO_PERIOD,
					fix: fixer => fixer.replaceText(member.value, JSON.stringify(fixed)),
				});
			} else if (endWithPeriod === true && !description.endsWith('.')) {
				const fixed = description + '.';

				context.report({
					node: member.value,
					messageId: MESSAGE_ID_PERIOD,
					fix: fixer => fixer.replaceText(member.value, JSON.stringify(fixed)),
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
			description: 'Enforce formatting of the `description` field.',
			recommended: false,
		},
		fixable: 'code',
		schema: optionsSchema({
			startWithUppercase: {
				type: 'boolean',
			},
			endWithPeriod: {
				type: 'boolean',
			},
		}),
		messages,
		languages: ['json/json'],
	},
};

export default config;
