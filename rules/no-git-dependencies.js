import {
	getRootObject,
	iterateDependencies,
	optionsSchema,
	gitSuffixPattern,
} from './utils/index.js';

const MESSAGE_ID = 'no-git-dependencies';

const messages = {
	[MESSAGE_ID]: 'Git dependency `{{name}}` should use a published version.',
};

const gitHostPrefixPattern = /^(?:github|gitlab|bitbucket):/;

// A bare `owner/repo` shorthand, matching how npm's `hosted-git-info` resolves it (the owner may
// contain dots, e.g. `my.org/repo`). Requiring an alphanumeric first character avoids matching
// local paths like `./foo` or `../foo`.
const bareShorthandPattern = /^[\da-z][\d\-.a-z]*\/[\w\-.]+(?:#.+)?$/i;

/**
Check if a dependency specifier references a git repository.
*/
const isGitSpecifier = specifier =>
	specifier.startsWith('git+')
	|| specifier.startsWith('git://')
	// SCP-style SSH shorthand, e.g. `git@github.com:owner/repo`.
	|| specifier.startsWith('git@')
	|| gitHostPrefixPattern.test(specifier)
	|| gitSuffixPattern.test(specifier)
	|| bareShorthandPattern.test(specifier);

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

				if (!isGitSpecifier(specifier)) {
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
