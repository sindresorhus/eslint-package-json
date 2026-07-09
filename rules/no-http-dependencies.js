import {getRootObject, iterateDependencies, gitSuffixPattern} from './utils/index.js';

const MESSAGE_ID = 'no-http-dependencies';

const messages = {
	[MESSAGE_ID]: 'HTTP dependency `{{name}}` should use a published version.',
};

/**
Check if a dependency specifier is a remote HTTP(S) tarball URL. Git URLs (the `git+https://` prefix or a `.git` suffix) are handled by `no-git-dependencies`.
*/
const isHttpSpecifier = specifier =>
	(specifier.startsWith('http://') || specifier.startsWith('https://'))
	&& !gitSuffixPattern.test(specifier);

/** @param {import('eslint').Rule.RuleContext} context */
const create = context => ({
	Document(node) {
		const root = getRootObject(node);

		if (!root) {
			return;
		}

		for (const {member, name} of iterateDependencies(root)) {
			if (member.value.type !== 'String') {
				continue;
			}

			if (!isHttpSpecifier(member.value.value)) {
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
			description: 'Disallow HTTP URLs as dependency specifiers.',
			recommended: true,
		},
		schema: [],
		messages,
		languages: ['json/json'],
	},
};

export default config;
