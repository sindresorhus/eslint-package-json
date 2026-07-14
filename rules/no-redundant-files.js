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
	/^package\.json$/u,
	/^readme(?:\.[^/]*[^$/~])?$/u,
	/^copying(?:\.[^/]*[^$/~])?$/u,
	/^licen[cs]e(?:\.[^/]*[^$/~])?$/u,
];
const EXTGLOB_PATTERN = /[!*+?@]\(/u;
const PARENT_PATH_PATTERN = /(?:^|[/\\])\.\.(?:[/\\]|$)/u;
const NON_ASCII_PATTERN = /\P{ASCII}/u;

/**
Lowercase ASCII characters like npm's case-insensitive path matching.
*/
function lowercaseAscii(value) {
	return value.replaceAll(/[A-Z]/gu, character => character.toLowerCase());
}

/**
Normalize a literal files path for case-insensitive ancestor comparisons.
*/
function normalizePath(value) {
	return lowercaseAscii(normalizeFilePath(value).replace(/\/+$/u, ''));
}

/**
Normalize a literal file path without treating a trailing slash as equivalent to a file.
*/
function normalizeFilePath(value) {
	const normalizedPath = path.posix.normalize(value.replaceAll('\\', '/'));
	return (normalizedPath === '.' ? '' : normalizedPath)
		.replace(/^(?:\.\/|\/)+/u, '');
}

/**
Check whether a files pattern cannot be safely compared statically.
*/
function isAmbiguousPattern(value) {
	return NON_ASCII_PATTERN.test(value) || hasGlob(value) || EXTGLOB_PATTERN.test(value) || PARENT_PATH_PATTERN.test(value);
}

/**
Check whether a files pattern is known to match an always-included file.
*/
function isAlwaysIncluded(value, alwaysIncludedPaths) {
	if (isAmbiguousPattern(value)) {
		return false;
	}

	const normalizedPath = lowercaseAscii(normalizeFilePath(value));
	return alwaysIncludedPaths.has(normalizedPath)
		|| ALWAYS_INCLUDED_PATTERNS.some(pattern => pattern.test(normalizedPath));
}

/**
Normalize a bin path like npm.
*/
function normalizeBinPath(value) {
	const unixPath = value.replaceAll(/[:\\]/gu, '/');
	const normalizedPath = path.posix.join('.', path.posix.join('/', unixPath));
	return normalizedPath.startsWith('./') ? '' : normalizedPath;
}

/**
Add a bin path using npm's package normalization.
*/
function addBinPath(paths, value) {
	const normalizedPath = normalizeBinPath(value);
	if (normalizedPath && !normalizedPath.endsWith('/')) {
		paths.add(lowercaseAscii(normalizedPath));
	}
}

/**
Normalize a bin command name like npm.
*/
function normalizeBinName(value) {
	return path.posix.basename(normalizeBinPath(value));
}

/**
Get bin paths that npm always includes.
*/
function getAlwaysIncludedPaths(root) {
	const paths = new Set();
	const binMember = findMember(root, 'bin');
	const nameMember = findMember(root, 'name');
	if (binMember?.value.type === 'String' && nameMember?.value.type === 'String') {
		const normalizedName = normalizeBinName(nameMember.value.value);
		if (normalizedName && normalizedName !== '__proto__') {
			addBinPath(paths, binMember.value.value);
		}
	} else if (binMember?.value.type === 'Object') {
		const effectiveEntries = new Map(binMember.value.members.map(member => [getKey(member), member.value.type === 'String' ? member.value.value : undefined]));

		for (const name of effectiveEntries.keys()) {
			const normalizedName = normalizeBinName(name);
			if (!normalizedName || normalizedName !== name) {
				return paths;
			}
		}

		for (const value of effectiveEntries.values()) {
			if (value === undefined) {
				continue;
			}

			addBinPath(paths, value);
		}
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
	if (!normalizedNegatedPattern) {
		return false;
	}

	if (!normalizedPositivePattern) {
		return true;
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

			const leadingBangs = value.match(/^!+/u)?.[0] ?? '';
			const isNegated = leadingBangs.length % 2 === 1;
			const pattern = value.slice(leadingBangs.length);
			if (leadingBangs && !pattern) {
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
