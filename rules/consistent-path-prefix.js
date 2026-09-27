import {
	getRootObject,
	findMember,
	hasGlob,
	iterateEffectiveMembers,
	optionsSchema,
	pathFields,
} from './utils/index.js';

const MESSAGE_ID_MISSING = 'missing';
const MESSAGE_ID_EXTRA = 'extra';
const MESSAGE_ID_OUTSIDE_PACKAGE = 'outsidePackage';
const PREFIX_SUGGESTION_ID = 'addPrefix';
const REMOVE_PREFIX_SUGGESTION_ID = 'removePrefix';

const messages = {
	[MESSAGE_ID_MISSING]: 'Path `{{value}}` should start with `./`.',
	[MESSAGE_ID_EXTRA]: 'Path `{{value}}` should not start with `./`.',
	[MESSAGE_ID_OUTSIDE_PACKAGE]: 'Path `{{value}}` has a `..` segment, which resolves inside the package at best and outside it at worst.',
	[PREFIX_SUGGESTION_ID]: 'Add the `./` prefix.',
	[REMOVE_PREFIX_SUGGESTION_ID]: 'Remove the `./` prefix.',
};

// Npm force-includes `main` and `browser` by pushing `!/${value}` for the value as written, so a `./` prefix on
// either stops the rule from matching and drops the file from the tarball. `bin` is not in this set because npm
// normalizes its targets before that comparison, and the remaining fields are not force-included at all.
const fieldsNpmComparesRaw = new Set(['main', 'browser']);

const absolutePathPattern = /^(?:[/\\]|[a-z]:)/iu;

/**
Check if a string value looks like a local relative path (not empty, not a glob, not a URL, not absolute).
*/
const isLocalRelativePath = value => {
	// An empty value is malformed rather than unprefixed, so there is nothing to add a `./` to.
	if (value === '' || hasGlob(value)) {
		return false;
	}

	if (absolutePathPattern.test(value)) {
		return false;
	}

	if (value.includes('://')) {
		return false;
	}

	return true;
};

/** @param {import('eslint').Rule.RuleContext} context */
const create = context => {
	const {prefix = 'always'} = context.options[0] ?? {};

	/**
	Check a string value node and report if needed.
	*/
	const checkPathNode = (valueNode, field) => {
		if (valueNode.type !== 'String') {
			return;
		}

		const {value} = valueNode;

		if (!isLocalRelativePath(value)) {
			return;
		}

		if (value.split(/[/\\]/u).includes('..')) {
			context.report({
				node: valueNode,
				messageId: MESSAGE_ID_OUTSIDE_PACKAGE,
				data: {value},
			});
			return;
		}

		// Backslash normalization belongs to `no-backslash-paths`; leave these reports without fixes to avoid conflicting fixes.
		const canFix = !value.includes('\\');

		if (prefix === 'always') {
			if (!value.startsWith('./')) {
				const fixed = './' + value;
				const base = {
					node: valueNode,
					messageId: MESSAGE_ID_MISSING,
					data: {value},
				};

				if (!canFix) {
					context.report(base);
					return;
				}

				const fix = fixer => fixer.replaceText(valueNode, JSON.stringify(fixed));

				// Adding the prefix to a field npm compares as written takes the file out of the tarball, so
				// it is offered as a suggestion rather than applied by `--fix`.
				context.report(
					fieldsNpmComparesRaw.has(field)
						? {...base, suggest: [{messageId: PREFIX_SUGGESTION_ID, fix}]}
						: {...base, fix},
				);
			}
		} else if (prefix === 'never' && value.startsWith('./')) {
			const fixed = value.slice(2);

			// A bare `./` has nothing to strip to, and stripping the prefix off a doubled separator leaves a
			// path rooted at the filesystem root, which is a different file from the one named. Leave both
			// alone rather than produce an empty or absolute path.
			if (fixed === '' || absolutePathPattern.test(fixed)) {
				return;
			}

			const base = {
				node: valueNode,
				messageId: MESSAGE_ID_EXTRA,
				data: {value},
			};

			if (!canFix) {
				context.report(base);
				return;
			}

			const fix = fixer => fixer.replaceText(valueNode, JSON.stringify(fixed));

			// Npm force-includes `main` and `browser` by comparing the value as written, so removing the prefix changes what npm publishes: the fix is a suggestion, exactly as the other direction is.
			context.report(
				fieldsNpmComparesRaw.has(field)
					? {...base, suggest: [{messageId: REMOVE_PREFIX_SUGGESTION_ID, fix}]}
					: {...base, fix},
			);
		}
	};

	return {
		Document(node) {
			const root = getRootObject(node);

			if (!root) {
				return;
			}

			for (const field of pathFields) {
				const member = findMember(root, field);

				if (!member) {
					continue;
				}

				// The object form of `browser` is a replacement map, and `checkPathNode` skips it. A bare value in that map is a module request resolved from the package root, not a relative path, so a `./` prefix would point it at a local file that does not exist.
				checkPathNode(member.value, field);
			}

			const binMember = findMember(root, 'bin');

			if (!binMember) {
				return;
			}

			if (binMember.value.type === 'String') {
				checkPathNode(binMember.value, 'bin');
			} else if (binMember.value.type === 'Object') {
				// Effective members, since a shadowed duplicate is not a path npm ever installs.
				for (const childMember of iterateEffectiveMembers(binMember.value)) {
					checkPathNode(childMember.value, 'bin');
				}
			}
		},
	};
};

/** @type {import('eslint').Rule.RuleModule} */
const config = {
	create,
	meta: {
		type: 'suggestion',
		docs: {
			description: 'Enforce consistent `./` prefix on local path fields.',
			recommended: true,
		},
		fixable: 'code',
		hasSuggestions: true,
		schema: optionsSchema({
			prefix: {
				enum: ['always', 'never'],
			},
		}),
		messages,
		languages: ['json/json'],
	},
};

export default config;
