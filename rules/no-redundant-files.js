import {
	getRootObject,
	findMember,
	removeElement,
	hasGlob,
} from './utils/index.js';

const MESSAGE_ID_DEFAULT = 'default';
const MESSAGE_ID_DUPLICATE = 'duplicate';
const MESSAGE_ID_INEFFECTIVE_NEGATION = 'ineffectiveNegation';

const messages = {
	[MESSAGE_ID_DEFAULT]: '`{{value}}` is always included by npm and is redundant in `files`.',
	[MESSAGE_ID_DUPLICATE]: '`{{value}}` is a duplicate entry in `files`.',
	[MESSAGE_ID_INEFFECTIVE_NEGATION]: 'No earlier `files` pattern can include `{{value}}`, so this negation is ineffective.',
};

// Patterns for files npm always includes.
const ALWAYS_INCLUDED_PATTERNS = [
	/^package\.json$/iu,
	/^readme(?:\.[^/]*[^$/~])?$/iu,
	/^copying(?:\.[^/]*[^$/~])?$/iu,
	/^licen[cs]e(?:\.[^/]*[^$/~])?$/iu,
];
const EXTGLOB_PATTERN = /[!*+?@]\(/u;

/**
Normalize a literal files path for ancestor comparisons.
*/
function normalizePath(value) {
	return value.replace(/^\.?\//u, '').replace(/\/+$/u, '');
}

/**
Check if a file path matches any always-included pattern.
*/
function isAlwaysIncluded(value, alwaysIncludedPaths) {
	const normalizedPath = normalizePath(value);
	return alwaysIncludedPaths.has(normalizedPath)
		|| ALWAYS_INCLUDED_PATTERNS.some(pattern => pattern.test(normalizedPath));
}

/**
Add a non-empty normalized path to a set of always-included paths.
*/
function addAlwaysIncludedPath(paths, value) {
	const path = normalizePath(value);
	if (path) {
		paths.add(path);
	}
}

/**
Get paths that npm always includes because they are package entry points.
*/
function getAlwaysIncludedPaths(root) {
	const paths = new Set();
	const main = findMember(root, 'main');

	if (main?.value.type === 'String') {
		addAlwaysIncludedPath(paths, main.value.value);
	}

	const bin = findMember(root, 'bin');
	if (bin?.value.type === 'String') {
		addAlwaysIncludedPath(paths, bin.value.value);
	} else if (bin?.value.type === 'Object') {
		for (const member of bin.value.members) {
			if (member.value.type !== 'String') {
				continue;
			}

			addAlwaysIncludedPath(paths, member.value.value);
		}
	}

	const browser = findMember(root, 'browser');
	if (browser?.value.type === 'String') {
		addAlwaysIncludedPath(paths, browser.value.value);
	}

	return paths;
}

/**
Check whether a files pattern uses glob syntax that this rule cannot safely compare.
*/
function isAmbiguousPattern(value) {
	return hasGlob(value) || EXTGLOB_PATTERN.test(value);
}

/**
Check whether a positive files pattern is known to be disjoint from a negated pattern.
*/
function isKnownToBeDisjoint(positivePattern, negatedPattern) {
	if (['*', '**', '.', './'].includes(positivePattern)) {
		return false;
	}

	if (isAmbiguousPattern(positivePattern) || isAmbiguousPattern(negatedPattern)) {
		return false;
	}

	const normalizedPositivePattern = normalizePath(positivePattern);
	const normalizedNegatedPattern = normalizePath(negatedPattern);

	return normalizedPositivePattern !== normalizedNegatedPattern
		&& !normalizedNegatedPattern.startsWith(`${normalizedPositivePattern}/`)
		&& !normalizedPositivePattern.startsWith(`${normalizedNegatedPattern}/`);
}

/**
Check whether a negation is provably ineffective based on earlier positive patterns.
*/
function isIneffectiveNegation(negatedPattern, positivePatterns) {
	return positivePatterns.every(positivePattern => isKnownToBeDisjoint(positivePattern, negatedPattern));
}

/**
Get the report message for a negated files pattern, if it is redundant.
*/
function getNegationMessageId(negatedPattern, positivePatterns, alwaysIncludedPaths) {
	if (!isAmbiguousPattern(negatedPattern) && isAlwaysIncluded(negatedPattern, alwaysIncludedPaths)) {
		return MESSAGE_ID_DEFAULT;
	}

	if (isIneffectiveNegation(negatedPattern, positivePatterns)) {
		return MESSAGE_ID_INEFFECTIVE_NEGATION;
	}
}

/** @param {import('eslint').Rule.RuleContext} context */
const create = context => ({
	Document(node) {
		const root = getRootObject(node);

		if (!root) {
			return;
		}

		const filesMember = findMember(root, 'files');

		if (!filesMember || filesMember.value.type !== 'Array') {
			return;
		}

		const {sourceCode} = context;
		const seen = new Set();
		const positivePatterns = [];
		const alwaysIncludedPaths = getAlwaysIncludedPaths(root);

		for (const element of filesMember.value.elements) {
			const valueNode = element.value;

			if (valueNode.type !== 'String') {
				continue;
			}

			const {value} = valueNode;

			// Check for exact duplicates (always, even for glob patterns).
			if (seen.has(value)) {
				context.report({
					node: valueNode,
					messageId: MESSAGE_ID_DUPLICATE,
					data: {value},
					* fix(fixer) {
						yield * removeElement(fixer, sourceCode, element);
					},
				});
				continue;
			}

			seen.add(value);

			if (value.startsWith('!')) {
				const negatedPattern = value.replace(/^!+/u, '');
				if (!negatedPattern) {
					continue;
				}

				const messageId = getNegationMessageId(negatedPattern, positivePatterns, alwaysIncludedPaths);

				if (messageId) {
					context.report({
						node: valueNode,
						messageId,
						data: {value: negatedPattern},
						* fix(fixer) {
							yield * removeElement(fixer, sourceCode, element);
						},
					});
				}

				continue;
			}

			positivePatterns.push(value);

			// Skip glob patterns for always-included check.
			if (hasGlob(value)) {
				continue;
			}

			if (isAlwaysIncluded(value, alwaysIncludedPaths)) {
				context.report({
					node: valueNode,
					messageId: MESSAGE_ID_DEFAULT,
					data: {value},
					* fix(fixer) {
						yield * removeElement(fixer, sourceCode, element);
					},
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
			description: 'Disallow redundant entries in the `files` field.',
			recommended: true,
		},
		fixable: 'code',
		schema: [],
		messages,
		languages: ['json/json'],
	},
};

export default config;
