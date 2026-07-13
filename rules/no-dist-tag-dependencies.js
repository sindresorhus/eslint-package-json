import {getRootObject, iterateDependencies, validRange} from './utils/index.js';

const MESSAGE_ID = 'no-dist-tag-dependencies';

const messages = {
	[MESSAGE_ID]: 'Dependency `{{name}}` uses the dist-tag `{{tag}}`; pin a version range for reproducible installs.',
};

/**
Check whether a specifier is a bare dist-tag (e.g. `latest`, `next`, `beta`) rather than a version range, protocol, or shorthand.
*/
const isDistTag = specifier => {
	if (specifier === '' || specifier.includes(':') || specifier.includes('/')) {
		return false;
	}

	// Version ranges (including `*`, `x`, `1.2.x`) parse as a valid range; tags do not.
	return validRange(specifier) === null;
};

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

			const specifier = member.value.value;

			if (isDistTag(specifier)) {
				context.report({
					node: member.value,
					messageId: MESSAGE_ID,
					data: {name, tag: specifier},
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
			description: 'Disallow dist-tags as dependency specifiers.',
			recommended: true,
		},
		schema: [],
		messages,
		languages: ['json/json'],
	},
};

export default config;
