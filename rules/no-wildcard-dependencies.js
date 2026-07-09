import semver from 'semver';
import {
	dependencyTypes,
	getRootObject,
	iterateDependencies,
	optionsSchema,
	stringArraySchema,
} from './utils/index.js';

const MESSAGE_ID = 'no-wildcard-dependencies';

const messages = {
	[MESSAGE_ID]: 'Dependency `{{name}}` must not use the wildcard range `{{range}}`; specify an explicit version range.',
};

// `peerDependencies` is excluded by default because `*` is a common, legitimate peer range (the consumer picks the version).
const defaultTypes = ['dependencies', 'devDependencies', 'optionalDependencies'];

/** @param {import('eslint').Rule.RuleContext} context */
const create = context => {
	const {dependencyTypes: types = defaultTypes, ignore = []} = context.options[0] ?? {};

	return {
		Document(node) {
			const root = getRootObject(node);

			if (!root) {
				return;
			}

			for (const {member, name} of iterateDependencies(root, types)) {
				if (ignore.includes(name) || member.value.type !== 'String') {
					continue;
				}

				const range = member.value.value;

				// A wildcard (`*`, ``, `x`, `X`) normalizes to `*`; real ranges, tags, and `workspace:`/`file:`/git/URL specifiers do not.
				if (semver.validRange(range) !== '*') {
					continue;
				}

				context.report({
					node: member.value,
					messageId: MESSAGE_ID,
					data: {name, range},
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
			description: 'Disallow wildcard version ranges for dependencies.',
			recommended: true,
		},
		schema: optionsSchema({
			dependencyTypes: {
				type: 'array',
				items: {
					enum: dependencyTypes,
				},
				uniqueItems: true,
			},
			ignore: stringArraySchema,
		}),
		messages,
		languages: ['json/json'],
	},
};

export default config;
