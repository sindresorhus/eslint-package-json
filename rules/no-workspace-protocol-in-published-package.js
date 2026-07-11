import {
	getRootObject,
	isPrivatePackage,
	iterateDependencies,
} from './utils/index.js';

const MESSAGE_ID = 'no-workspace-protocol-in-published-package';

const messages = {
	[MESSAGE_ID]: 'Workspace dependency `{{name}}` requires a package-manager rewrite before publication.',
};

/** @param {import('eslint').Rule.RuleContext} context */
const create = context => ({
	Document(node) {
		const root = getRootObject(node);

		if (!root || isPrivatePackage(root)) {
			return;
		}

		for (const {member, name} of iterateDependencies(root)) {
			if (member.value.type !== 'String' || !member.value.value.startsWith('workspace:')) {
				continue;
			}

			context.report({
				node: member.value,
				messageId: MESSAGE_ID,
				data: {name},
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
			description: 'Disallow `workspace:` dependency specifiers in packages that can be published.',
			recommended: true,
		},
		schema: [],
		messages,
		languages: ['json/json'],
	},
};

export default config;
