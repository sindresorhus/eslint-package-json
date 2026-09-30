import path from 'node:path';
import {
	findMember,
	getRootObject,
	removeMemberAndDuplicates,
} from './utils/index.js';

const MESSAGE_ID = 'no-nested-exports';
const SUGGESTION_ID = 'remove';

const messages = {
	[MESSAGE_ID]: 'The `exports` field is ignored for a consumer resolving this package by name. Node reads it only for a self-reference from inside this scope, which needs a matching `name`.',
	[SUGGESTION_ID]: 'Remove the field.',
};

/**
Whether the current file is a package.json below the configured working directory.
*/
function isNestedPackageJson(context) {
	const {physicalFilename} = context;

	if (physicalFilename.startsWith('<')) {
		return false;
	}

	const workingDirectory = path.resolve(context.cwd);
	const packagePath = path.resolve(workingDirectory, physicalFilename);
	const relativePath = path.relative(workingDirectory, packagePath);

	return relativePath !== ''
		&& relativePath !== '..'
		&& !relativePath.startsWith(`..${path.sep}`)
		&& !path.isAbsolute(relativePath)
		&& path.basename(packagePath) === 'package.json'
		&& path.dirname(packagePath) !== workingDirectory;
}

/** @param {import('eslint').Rule.RuleContext} context */
const create = context => {
	const {sourceCode} = context;

	return {
		Document(node) {
			if (!isNestedPackageJson(context)) {
				return;
			}

			const root = getRootObject(node);

			if (!root) {
				return;
			}

			// `imports` is deliberately not checked: Node resolves a `#specifier` against the nearest package scope, so a nested manifest's `imports` is honored for files inside it. `exports` is read the same way, but only for a self-reference from inside the nested scope, and only when its `name` matches the package being resolved. No consumer resolving the package by name from outside ever sees it, which is what a nested `exports` is nearly always a mistake for.
			const member = findMember(root, 'exports');

			if (member) {
				context.report({
					node: member.name,
					messageId: MESSAGE_ID,
					suggest: [
						{
							messageId: SUGGESTION_ID,
							* fix(fixer) {
								yield * removeMemberAndDuplicates(fixer, sourceCode, member);
							},
						},
					],
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
			description: 'Disallow `exports` in nested `package.json` files.',
			recommended: true,
		},
		hasSuggestions: true,
		schema: [],
		messages,
		languages: ['json/json'],
	},
};

export default config;
