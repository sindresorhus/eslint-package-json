import {
	getRootObject,
	isGitRemote,
	iterateDependencies,
	optionsSchema,
} from './utils/index.js';

const MESSAGE_ID = 'no-git-dependencies';

const messages = {
	[MESSAGE_ID]: 'Git dependency `{{name}}` should use a published version.',
};

/** @param {import('eslint').Rule.RuleContext} context */
const create = context => {
	const {allowWithRef = false} = context.options[0] ?? {};

	return {
		Document(node) {
			const root = getRootObject(node);

			if (!root) {
				return;
			}

			for (const {member, name} of iterateDependencies(root)) {
				if (member.value.type !== 'String') {
					continue;
				}

				const specifier = member.value.value;

				if (!isGitRemote(specifier)) {
					continue;
				}

				if (allowWithRef && specifier.includes('#')) {
					continue;
				}

				context.report({
					node: member.value,
					messageId: MESSAGE_ID,
					data: {name},
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
			description: 'Disallow git URLs as dependency specifiers.',
			recommended: false,
		},
		schema: optionsSchema({
			allowWithRef: {
				type: 'boolean',
			},
		}),
		messages,
		languages: ['json/json'],
	},
};

export default config;
