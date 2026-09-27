import {
	getRootObject,
	isGitRemote,
	iterateDependencies,
} from './utils/index.js';

const MESSAGE_ID = 'no-http-dependencies';

const messages = {
	[MESSAGE_ID]: 'HTTP dependency `{{name}}` should use a published version.',
};

const httpSchemePattern = /^https?:\/\//iu;

/**
Check if a dependency specifier is a remote HTTP(S) tarball URL. Git URLs are handled by `no-git-dependencies`, so asking npm is what keeps the two from claiming the same specifier, and it is also what tells a hosted remote from a tarball: `https://github.com/user/repo` and `https://example.com/foo.git` both look like a repository URL, but only the first one is one npm clones.
*/
const isHttpSpecifier = specifier =>
	httpSchemePattern.test(specifier)
	&& !isGitRemote(specifier);

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
