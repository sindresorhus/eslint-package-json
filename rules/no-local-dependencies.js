import {
	getRootObject,
	iterateDependencies,
	optionsSchema,
	stringArraySchema,
} from './utils/index.js';

const MESSAGE_ID = 'no-local-dependencies';

const messages = {
	[MESSAGE_ID]: 'Local dependency `{{name}}` should not be published.',
};

const localPrefixes = ['file:', 'link:', './', '../', '/', '~/'];

// A consumer never installs `devDependencies`, so a local path there cannot break anyone: it is how packages point at test fixtures and self-link for dogfooding. Only the groups npm actually installs downstream are checked.
const installedDependencyTypes = ['dependencies', 'optionalDependencies', 'peerDependencies'];

/**
Check if a dependency specifier references the local filesystem.
*/
const isLocalSpecifier = specifier => localPrefixes.some(prefix => specifier.startsWith(prefix));

/** @param {import('eslint').Rule.RuleContext} context */
const create = context => {
	const {ignore = []} = context.options[0] ?? {};

	return {
		Document(node) {
			const root = getRootObject(node);

			if (!root) {
				return;
			}

			for (const {member, name} of iterateDependencies(root, installedDependencyTypes)) {
				if (ignore.includes(name) || member.value.type !== 'String') {
					continue;
				}

				if (!isLocalSpecifier(member.value.value)) {
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
			description: 'Disallow local filesystem paths as dependency specifiers.',
			recommended: false,
		},
		schema: optionsSchema({ignore: stringArraySchema}),
		messages,
		languages: ['json/json'],
	},
};

export default config;
