import {getRootObject, getKey, findMember} from './utils/index.js';

const MESSAGE_ID = 'consistent-name-casing';

const messages = {
	[MESSAGE_ID]: '`{{name}}` in `{{group}}` should be kebab-case.',
};

/**
The npm lifecycle script names that are allowed despite not being kebab-case. Every other lifecycle name (`preinstall`, `postpack`, etc.) is already lowercase and passes the kebab check, so `prepublishOnly` is the only special case.
*/
const allowedScriptNames = new Set(['prepublishOnly']);

/**
Check whether a string segment is kebab-case: lowercase alphanumerics separated by single hyphens.
*/
const isKebabSegment = segment => /^[\da-z]+(?:-[\da-z]+)*$/.test(segment);

/**
Check whether a key is kebab-case when split by `:` into segments.
*/
const isKebabCase = key => key.split(':').every(segment => isKebabSegment(segment));

/** @param {import('eslint').Rule.RuleContext} context */
const create = context => ({
	Document(node) {
		const root = getRootObject(node);

		if (!root) {
			return;
		}

		const scriptsMember = findMember(root, 'scripts');

		if (scriptsMember?.value.type === 'Object') {
			for (const member of scriptsMember.value.members) {
				const name = getKey(member);

				if (allowedScriptNames.has(name) || isKebabCase(name)) {
					continue;
				}

				context.report({
					node: member.name,
					messageId: MESSAGE_ID,
					data: {name, group: 'scripts'},
				});
			}
		}

		const binMember = findMember(root, 'bin');

		if (binMember?.value.type === 'Object') {
			for (const member of binMember.value.members) {
				const name = getKey(member);

				if (isKebabCase(name)) {
					continue;
				}

				context.report({
					node: member.name,
					messageId: MESSAGE_ID,
					data: {name, group: 'bin'},
				});
			}
		}
	},
});

/** @type {import('eslint').Rule.RuleModule} */
const config = {
	create,
	meta: {
		type: 'suggestion',
		docs: {
			description: 'Enforce kebab-case for keys in `scripts` and `bin` objects.',
			recommended: false,
		},
		schema: [],
		messages,
		languages: ['json/json'],
	},
};

export default config;
