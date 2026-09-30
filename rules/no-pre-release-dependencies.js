import {
	getRootObject,
	installedSpecifier,
	iterateDependencies,
	optionsSchema,
	stringArraySchema,
	targetsPrerelease,
} from './utils/index.js';

const MESSAGE_ID = 'no-pre-release-dependencies';

const messages = {
	[MESSAGE_ID]: 'Dependency `{{name}}` targets a pre-release version `{{version}}`.',
};

/** @param {import('eslint').Rule.RuleContext} context */
const create = context => {
	const {ignore = []} = context.options[0] ?? {};

	return {
		Document(node) {
			const root = getRootObject(node);

			if (!root) {
				return;
			}

			for (const {member, name} of iterateDependencies(root)) {
				if (ignore.includes(name) || member.value.type !== 'String') {
					continue;
				}

				const specifier = member.value.value;

				// An `npm:` alias installs at the range it carries, so `npm:foo@1.0.0-beta` targets a pre-release even though the alias string itself is neither a version nor a range. `npm-package-arg` parses that range with semver's loose grammar, so `1.0.0-01` is a pre-release too.
				if (!targetsPrerelease(installedSpecifier(specifier), {loose: true})) {
					continue;
				}

				context.report({
					node: member.value,
					messageId: MESSAGE_ID,
					data: {name, version: specifier},
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
			description: 'Disallow pre-release versions as dependency specifiers.',
			recommended: false,
		},
		schema: optionsSchema({ignore: stringArraySchema}),
		messages,
		languages: ['json/json'],
	},
};

export default config;
