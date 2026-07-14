import path from 'node:path';
import {
	getRootObject,
	findMember,
	getKey,
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
const PARENT_PATH_PATTERN = /(?:^|[/\\])\.\.(?:[/\\]|$)/u;

/**
Normalize a literal files path for case-insensitive ancestor comparisons.
*/
function normalizePath(value) {
	return normalizeFilePath(value).replace(/\/+$/u, '');
}

/**
Normalize a literal file path without treating a trailing slash as equivalent to a file.
*/
function normalizeFilePath(value) {
	const normalizedPath = path.posix.normalize(value.replaceAll('\\', '/'));
	return (normalizedPath === '.' ? '' : normalizedPath)
		.replace(/^(?:\.\/|\/)+/u, '')
		.toLowerCase();
}

/**
Check whether an entry-point value can refer to a path inside the package.
*/
function isPackageLocalPath(value) {
	const normalizedPath = value.replaceAll('\\', '/');
	return !normalizedPath.startsWith('/')
		&& !URL.canParse(value)
		&& !value.split(/[/\\]/u).includes('..');
}

/**
Check whether a files pattern uses syntax that this rule cannot safely compare.
*/
function isAmbiguousPattern(value) {
	return hasGlob(value) || EXTGLOB_PATTERN.test(value) || PARENT_PATH_PATTERN.test(value);
}

/**
Check whether a files pattern is known to match an always-included file.
*/
function isAlwaysIncluded(value, alwaysIncludedPaths) {
	if (isAmbiguousPattern(value)) {
		return false;
	}

	const normalizedPath = normalizeFilePath(value);
	return alwaysIncludedPaths.has(normalizedPath)
		|| ALWAYS_INCLUDED_PATTERNS.some(pattern => pattern.test(normalizedPath));
}

/**
Add a non-empty normalized path to a set of always-included paths.
*/
function addAlwaysIncludedPath(paths, value) {
	if (!isPackageLocalPath(value)) {
		return;
	}

	const normalizedPath = normalizeFilePath(value);
	if (normalizedPath && !normalizedPath.endsWith('/')) {
		paths.add(normalizedPath);
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
		const effectiveEntries = new Map();

		for (const member of bin.value.members) {
			effectiveEntries.set(getKey(member), member.value.type === 'String' ? member.value.value : undefined);
		}

		for (const value of effectiveEntries.values()) {
			if (value !== undefined) {
				addAlwaysIncludedPath(paths, value);
			}
		}
	}

	const browser = findMember(root, 'browser');
	if (browser?.value.type === 'String') {
		addAlwaysIncludedPath(paths, browser.value.value);
	}

	return paths;
}

/**
Check whether a positive files pattern is known to be disjoint from a negated pattern.
*/
function isKnownToBeDisjoint(positivePattern, negatedPattern) {
	if (isAmbiguousPattern(positivePattern) || isAmbiguousPattern(negatedPattern)) {
		return false;
	}

	const normalizedPositivePattern = normalizePath(positivePattern);
	const normalizedNegatedPattern = normalizePath(negatedPattern);
	if (!normalizedPositivePattern || !normalizedNegatedPattern) {
		return false;
	}

	return normalizedPositivePattern !== normalizedNegatedPattern
		&& !normalizedNegatedPattern.startsWith(`${normalizedPositivePattern}/`)
		&& !normalizedPositivePattern.startsWith(`${normalizedNegatedPattern}/`);
}

/**
Check whether a negation is provably ineffective based on earlier positive patterns.
*/
function isIneffectiveNegation(negatedPattern, positivePatterns) {
	if (!normalizePath(negatedPattern)) {
		return false;
	}

	return positivePatterns.every(positivePattern => isKnownToBeDisjoint(positivePattern, negatedPattern));
}

/**
Get the report message for a negated files pattern, if it is redundant.
*/
function getNegationMessageId(negatedPattern, positivePatterns, alwaysIncludedPaths) {
	if (isAlwaysIncluded(negatedPattern, alwaysIncludedPaths)) {
		return MESSAGE_ID_DEFAULT;
	}

	if (isIneffectiveNegation(negatedPattern, positivePatterns)) {
		return MESSAGE_ID_INEFFECTIVE_NEGATION;
	}
}

/**
Check whether an exact files entry is redundant because no intervening opposite pattern can affect it.
*/
function isDuplicatePattern(pattern, isNegated, previousIndex, patternHistory) {
	for (const previousPattern of patternHistory.slice(previousIndex + 1)) {
		if (previousPattern.isNegated === isNegated) {
			continue;
		}

		const positivePattern = isNegated ? previousPattern.pattern : pattern;
		const negatedPattern = isNegated ? pattern : previousPattern.pattern;
		if (!isKnownToBeDisjoint(positivePattern, negatedPattern)) {
			return false;
		}
	}

	return true;
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
		const seen = new Map();
		const positivePatterns = [];
		const patternHistory = [];
		const alwaysIncludedPaths = getAlwaysIncludedPaths(root);

		for (const element of filesMember.value.elements) {
			const valueNode = element.value;

			if (valueNode.type !== 'String') {
				continue;
			}

			const {value} = valueNode;

			const leadingBangCount = value.match(/^!+/u)?.[0].length ?? 0;
			const pattern = value.slice(leadingBangCount);
			const isNegated = leadingBangCount % 2 === 1;
			if (!pattern && isNegated) {
				continue;
			}

			const previousIndex = seen.get(value);
			const isDuplicate = previousIndex !== undefined
				&& isDuplicatePattern(pattern, isNegated, previousIndex, patternHistory);

			if (isDuplicate) {
				context.report({
					node: valueNode,
					messageId: MESSAGE_ID_DUPLICATE,
					data: {value},
					* fix(fixer) {
						yield * removeElement(fixer, sourceCode, element);
					},
				});
			}

			seen.set(value, patternHistory.length);
			patternHistory.push({pattern, isNegated});
			if (isDuplicate) {
				continue;
			}

			if (isNegated) {
				const messageId = getNegationMessageId(pattern, positivePatterns, alwaysIncludedPaths);

				if (messageId) {
					context.report({
						node: valueNode,
						messageId,
						data: {value: pattern},
						* fix(fixer) {
							yield * removeElement(fixer, sourceCode, element);
						},
					});
				}

				continue;
			}

			positivePatterns.push(pattern);

			if (isAlwaysIncluded(pattern, alwaysIncludedPaths)) {
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
