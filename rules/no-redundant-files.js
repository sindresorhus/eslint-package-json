import path from 'node:path';
import {
	getRootObject,
	findMember,
	isAlwaysIncludedFile,
	getKey,
	normalizeBinName,
	normalizeBinPath,
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
	return alwaysIncludedPaths.has(normalizedPath) || isAlwaysIncludedFile(normalizedPath);
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
Get the target of every `bin` entry that survives npm's normalization.

Npm walks the object in key order, renames each key to its basename, and writes the target onto the renamed key. A
rename therefore lands on a key npm has not read yet and replaces the value npm would have read from it, so
`{"commands/cli": "a.js", "cli": "b.js"}` publishes `a.js`: the first key renames onto `cli` and overwrites the
second one before npm reaches it. A key that normalizes to nothing (`""`, `.`, `..`) is dropped, and so is one that
renames onto `__proto__`, which sets the prototype of npm's own object instead of a member of it.
*/
function * iterateNormalizedBinTargets(binObject) {
	// The object npm walks, so a rename writes onto a key a later iteration then reads.
	const bin = new Map();

	for (const member of binObject.members) {
		bin.set(getKey(member), member.value.type === 'String' ? member.value.value : undefined);
	}

	// The keys are read up front, because a rename writes onto a key npm has not read yet and a live iterator
	// would walk into it.
	const keys = bin.keys().toArray();

	for (const key of keys) {
		const value = bin.get(key);

		if (typeof value !== 'string') {
			bin.delete(key);
			continue;
		}

		const commandName = normalizeBinName(key);

		// A key that normalizes to nothing names no command, and one that renames *onto* `__proto__` sets the
		// prototype of npm's own object rather than a member of it, so npm drops it. A key that already is
		// `__proto__` is the other case: `JSON.parse` makes it an own data property, so npm keeps it.
		if (!commandName || (commandName === '__proto__' && commandName !== key)) {
			bin.delete(key);
			continue;
		}

		const binTarget = normalizeBinPath(value);

		if (!binTarget) {
			bin.delete(key);
			continue;
		}

		bin.delete(key);
		bin.set(commandName, binTarget);
	}

	yield * bin.values();
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
		// Npm pushes a strict rule for every `bin` value that survives normalization, so a key holding a path
		// separator, a drive, or a colon still gets its target published.
		for (const value of iterateNormalizedBinTargets(binMember.value)) {
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
	// A pattern that normalizes away (`.`, `./`, `/`, ``) names the package root, which contains everything, so it is disjoint from nothing.
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

		// Every fix below takes one entry out of the array and never the field itself. An absent `files` is
		// npm's "publish everything", the opposite of the empty array, so the last entry has to go with the
		// array left standing as `"files": []`.
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
			// Npm-packlist prepends one `!` to the entry and compiles the result with minimatch's `flipNegate`,
			// which inverts an odd number of leading bangs and leaves an even one as an inclusion. So `!dist`
			// drops `dist`, `!!dist` keeps it, and `!!!dist` drops it again. The two npm majors disagree here:
			// npm 12 reads any leading bang as a negation. This rule follows npm 11, the same major
			// `no-missing-files` follows, so `["!!dist"]` is an entry that publishes `dist` rather than a
			// negation that publishes nothing.
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
