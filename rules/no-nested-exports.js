import path from 'node:path';
import {
	findMember,
	getKey,
	getRootObject,
	removeMember,
} from './utils/index.js';

const MESSAGE_ID = 'no-nested-exports';
const SUGGESTION_ID = 'remove';

const messages = {
	[MESSAGE_ID]: 'The `{{field}}` field is ignored in nested `package.json` files.',
	[SUGGESTION_ID]: 'Remove the `{{field}}` field.',
};

const fields = ['exports', 'imports'];

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

			for (const field of fields) {
				const member = findMember(root, field);

				if (!member) {
					continue;
				}

				const hasDuplicate = root.members.some(candidate => candidate !== member && getKey(candidate) === field);
				const report = {
					node: member.name,
					messageId: MESSAGE_ID,
					data: {field},
				};

				// Removing only the effective member would expose the earlier duplicate.
				if (!hasDuplicate) {
					report.suggest = [
						{
							messageId: SUGGESTION_ID,
							data: {field},
							* fix(fixer) {
								yield * removeMember(fixer, sourceCode, member);
							},
						},
					];
				}

				context.report(report);
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
			description: 'Disallow `exports` and `imports` in nested `package.json` files.',
			recommended: true,
		},
		hasSuggestions: true,
		schema: [],
		messages,
		languages: ['json/json'],
	},
};

export default config;
