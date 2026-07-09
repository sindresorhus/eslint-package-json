import semver from 'semver';
import {
	getRootObject,
	iterateDependencies,
	optionsSchema,
	stringArraySchema,
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

				// A pre-release identifier always contains a hyphen (`1.0.0-beta`), so anything without one cannot resolve to a pre-release. This skips the expensive `semver.minVersion` for the overwhelming majority of specifiers.
				if (!specifier.includes('-')) {
					continue;
				}

				let min;
				try {
					min = semver.minVersion(specifier);
				} catch {
					min = null;
				}

				if (!min || semver.prerelease(min) === null) {
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
