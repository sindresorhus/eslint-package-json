import npa from 'npm-package-arg';
import {getRootObject, installedSpecifier, iterateDependencies} from './utils/index.js';

const MESSAGE_ID = 'no-dist-tag-dependencies';

const messages = {
	[MESSAGE_ID]: 'Dependency `{{name}}` uses the dist-tag `{{tag}}`; pin a version range for reproducible installs.',
};

/**
Whether npm reads a specifier as a dist-tag. Asking `npm-package-arg` settles every form at once, including the loose versions it accepts (`1.0.0-01`, `01.2.3`) and the path and protocol forms, which are not tags either. A protocol it refuses, such as `workspace:` or `link:`, is not a tag.
*/
const isDistTag = specifier => {
	try {
		return npa(`any@${specifier}`).type === 'tag';
	} catch {
		return false;
	}
};

/**
Get the dist-tag a specifier resolves to, or `undefined` when it is not pinned to one.

Version ranges (including `*`, `x` and `1.2.x`) parse as a range, and tags do not.
*/
const getDistTag = specifier => {
	// An `npm:` alias carries its own specifier, which may itself be a scoped package name, so the tag is the one it aliases, not the whole alias. A specifier that is not an alias resolves to nothing, and is then read as itself.
	const subject = installedSpecifier(specifier);

	return isDistTag(subject) ? subject : undefined;
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
			const tag = getDistTag(specifier);

			if (tag !== undefined) {
				context.report({
					node: member.value,
					messageId: MESSAGE_ID,
					data: {name, tag},
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
