import fs from 'node:fs';
import path from 'node:path';
import {
	findMember,
	getKey,
	getRootObject,
	hasGlob,
} from './utils/index.js';

const MESSAGE_ID_EXPORT = 'missingExportTarget';
const MESSAGE_ID_FILES = 'missingFilesPattern';

const messages = {
	[MESSAGE_ID_EXPORT]: 'Export target `{{value}}` does not exist.',
	[MESSAGE_ID_FILES]: 'The `files` pattern `{{value}}` does not match any file or directory.',
};

const windowsAbsolutePathPattern = /^[a-z]:[/\\]/iu;
const extglobPattern = /[!+@]\(/u;
const invalidExportTargetPattern = /(?:^|\/)(?:\.{1,2}|node_modules)(?:\/|$)|%2e|%2f|%5c|(?:^|\/)%6eode_modules(?:\/|$)/iu;

const isGlobPattern = value => hasGlob(value) || extglobPattern.test(value);

/**
Check whether a relative path is safe to resolve inside the package directory.
*/
const isSafePackagePath = value => !value.includes('\0')
	&& !value.includes('\\')
	&& !value.split('/').includes('..');

/**
Check whether a literal relative path exists with the exact casing used in the path.
*/
const hasExactPath = (packageDirectory, value, requiresFile) => {
	const relativePath = value.slice(2);

	if (!relativePath || !isSafePackagePath(relativePath)) {
		return false;
	}

	let currentDirectory = packageDirectory;

	for (const segment of relativePath.split('/')) {
		if (!segment || segment === '.') {
			continue;
		}

		let entries;

		try {
			entries = fs.readdirSync(currentDirectory, {withFileTypes: true});
		} catch {
			return false;
		}

		if (entries.every(entry => entry.name !== segment)) {
			return false;
		}

		currentDirectory = path.join(currentDirectory, segment);
	}

	try {
		const statistics = fs.statSync(currentDirectory);
		return !requiresFile || statistics.isFile();
	} catch {
		return false;
	}
};

/**
Check whether a character matches a glob character class.
*/
const isCharacterInClass = (character, classValue) => {
	const isNegated = classValue.startsWith('!') || classValue.startsWith('^');
	const classCharacters = isNegated ? classValue.slice(1) : classValue;
	let isMatched = false;

	for (let index = 0; index < classCharacters.length; index++) {
		if (classCharacters[index + 1] === '-' && classCharacters[index + 2] !== undefined) {
			isMatched ||= character >= classCharacters[index] && character <= classCharacters[index + 2];
			index += 2;
		} else {
			isMatched ||= character === classCharacters[index];
		}
	}

	return isNegated ? !isMatched : isMatched;
};

/**
Find the closing brace for a glob brace expression.
*/
const findClosingBrace = (value, openingIndex) => {
	let depth = 0;

	for (let index = openingIndex; index < value.length; index++) {
		if (value[index] === '{') {
			depth++;
		} else if (value[index] === '}') {
			depth--;

			if (depth === 0) {
				return index;
			}
		}
	}

	return -1;
};

/**
Expand brace alternatives that span path segments before applying the exact-case matcher.
*/
const expandBracePatterns = pattern => {
	const openingIndex = pattern.indexOf('{');

	if (openingIndex === -1) {
		return [pattern];
	}

	const closingIndex = findClosingBrace(pattern, openingIndex);

	if (closingIndex === -1) {
		return [pattern];
	}

	const content = pattern.slice(openingIndex + 1, closingIndex);
	const alternatives = [];
	let depth = 0;
	let startIndex = 0;

	for (let index = 0; index < content.length; index++) {
		if (content[index] === '{') {
			depth++;
		} else if (content[index] === '}') {
			depth--;
		} else if (content[index] === ',' && depth === 0) {
			alternatives.push(content.slice(startIndex, index));
			startIndex = index + 1;
		}
	}

	if (alternatives.length === 0) {
		const prefix = pattern.slice(0, closingIndex + 1);
		const suffixPatterns = expandBracePatterns(pattern.slice(closingIndex + 1));
		return suffixPatterns.map(suffix => prefix + suffix);
	}

	alternatives.push(content.slice(startIndex));
	const prefix = pattern.slice(0, openingIndex);
	const suffix = pattern.slice(closingIndex + 1);
	const expandedPatterns = [];

	for (const alternative of alternatives) {
		expandedPatterns.push(...expandBracePatterns(prefix + alternative + suffix));
	}

	return expandedPatterns;
};

/**
Find the closing parenthesis for a glob extglob expression.
*/
const findClosingParenthesis = (value, openingIndex) => {
	let depth = 0;

	for (let index = openingIndex; index < value.length; index++) {
		if (value[index] === '(') {
			depth++;
		} else if (value[index] === ')') {
			depth--;

			if (depth === 0) {
				return index;
			}
		}
	}

	return -1;
};

/**
Expand simple `@()` extglobs before applying the exact-case matcher.
*/
const expandAtExtglobPatterns = pattern => {
	const openingIndex = pattern.indexOf('@(');

	if (openingIndex === -1) {
		return [pattern];
	}

	const closingIndex = findClosingParenthesis(pattern, openingIndex + 1);

	if (closingIndex === -1) {
		return [pattern];
	}

	const content = pattern.slice(openingIndex + 2, closingIndex);
	const alternatives = [];
	let depth = 0;
	let startIndex = 0;

	for (let index = 0; index < content.length; index++) {
		if (content[index] === '(') {
			depth++;
		} else if (content[index] === ')') {
			depth--;
		} else if (content[index] === '|' && depth === 0) {
			alternatives.push(content.slice(startIndex, index));
			startIndex = index + 1;
		}
	}

	alternatives.push(content.slice(startIndex));
	const prefix = pattern.slice(0, openingIndex);
	const suffix = pattern.slice(closingIndex + 1);
	const expandedPatterns = [];

	for (const alternative of alternatives) {
		expandedPatterns.push(...expandAtExtglobPatterns(prefix + alternative + suffix));
	}

	return expandedPatterns;
};

/**
Match one character-class segment of a glob pattern.
*/
const matchCharacterClass = ({valueSegment, patternSegment, valueIndex, patternIndex, match}) => {
	const closingBracket = patternSegment.indexOf(']', patternIndex + 1);

	if (closingBracket === -1) {
		return valueIndex < valueSegment.length
			&& valueSegment[valueIndex] === patternSegment[patternIndex]
			&& match(valueIndex + 1, patternIndex + 1);
	}

	return valueIndex < valueSegment.length
		&& isCharacterInClass(valueSegment[valueIndex], patternSegment.slice(patternIndex + 1, closingBracket))
		&& match(valueIndex + 1, closingBracket + 1);
};

/**
Check whether a filesystem path matches a glob pattern with exact casing.
*/
const matchesGlobExactly = (value, pattern) => {
	const bracePatterns = expandBracePatterns(pattern);

	if (bracePatterns.length > 1) {
		return bracePatterns.some(bracePattern => matchesGlobExactly(value, bracePattern));
	}

	const extglobPatterns = expandAtExtglobPatterns(pattern);

	if (extglobPatterns.length > 1) {
		return extglobPatterns.some(extglobPattern => matchesGlobExactly(value, extglobPattern));
	}

	const valueSegments = value.replaceAll(path.sep, '/').replace(/^\.\//u, '').split('/');
	const patternSegments = pattern.replace(/^\.\//u, '').split('/');

	function matchesSegment(valueSegment, patternSegment) {
		const cache = new Map();

		const match = (valueIndex, patternIndex) => {
			const cacheKey = `${valueIndex}:${patternIndex}`;

			const cachedResult = cache.get(cacheKey);

			if (cachedResult !== undefined) {
				return cachedResult;
			}

			let result;

			if (patternIndex === patternSegment.length) {
				result = valueIndex === valueSegment.length;
			} else {
				switch (patternSegment[patternIndex]) {
					case '*': {
						result = match(valueIndex, patternIndex + 1)
							|| (valueIndex < valueSegment.length && match(valueIndex + 1, patternIndex));
						break;
					}

					case '?': {
						result = valueIndex < valueSegment.length && match(valueIndex + 1, patternIndex + 1);
						break;
					}

					case '[': {
						result = matchCharacterClass({
							valueSegment, patternSegment, valueIndex, patternIndex, match,
						});

						break;
					}

					default: {
						result = valueIndex < valueSegment.length
							&& valueSegment[valueIndex] === patternSegment[patternIndex]
							&& match(valueIndex + 1, patternIndex + 1);
					}
				}
			}

			cache.set(cacheKey, result);
			return result;
		};

		return match(0, 0);
	}

	const cache = new Map();

	const match = (valueIndex, patternIndex) => {
		const cacheKey = `${valueIndex}:${patternIndex}`;

		const cachedResult = cache.get(cacheKey);

		if (cachedResult !== undefined) {
			return cachedResult;
		}

		let result;

		if (patternIndex === patternSegments.length) {
			result = valueIndex === valueSegments.length;
		} else if (patternSegments[patternIndex] === '**') {
			result = match(valueIndex, patternIndex + 1)
				|| (valueIndex < valueSegments.length && match(valueIndex + 1, patternIndex));
		} else {
			result = valueIndex < valueSegments.length
				&& matchesSegment(valueSegments[valueIndex], patternSegments[patternIndex])
				&& match(valueIndex + 1, patternIndex + 1);
		}

		cache.set(cacheKey, result);
		return result;
	};

	return match(0, 0);
};

/**
Add dot-file alternatives to a filesystem glob pattern because Node's glob does not include dotfiles by default.
*/
const getDotFilePattern = pattern => pattern.split('/').map(segment =>
	segment.startsWith('.') || segment.startsWith('{') ? segment : `{.,}${segment}`,
).join('/');

/**
Check whether a filesystem glob has an exact-case match.
*/
const hasMatchingGlob = (packageDirectory, pattern, requiresFile) => {
	try {
		return fs.globSync(getDotFilePattern(pattern), {
			cwd: packageDirectory,
		}).some(match => {
			const relativePath = match.replaceAll(path.sep, '/');
			return matchesGlobExactly(relativePath, pattern)
				&& hasExactPath(packageDirectory, `./${relativePath}`, requiresFile);
		});
	} catch {
		return false;
	}
};

/**
Check whether an exports target matches a path using Node's `*` replacement semantics.
*/
const matchesExportPattern = (value, pattern) => {
	const parts = pattern.split('*');

	if (parts.length === 1) {
		return value === pattern;
	}

	if (!value.startsWith(parts[0])) {
		return false;
	}

	if (parts.length === 2) {
		return value.length >= pattern.length - 1 && value.endsWith(parts[1]);
	}

	for (let wildcardLength = 0; wildcardLength <= value.length - parts[0].length; wildcardLength++) {
		const replacement = value.slice(parts[0].length, parts[0].length + wildcardLength);
		let expectedValue = parts[0];

		for (const part of parts.slice(1)) {
			expectedValue += replacement + part;
		}

		if (expectedValue === value) {
			return true;
		}
	}

	return false;
};

/**
Get the smallest directory tree that can contain an exports target match.
*/
const getExportScanPattern = pattern => {
	const wildcardIndex = pattern.indexOf('*');
	const directorySeparatorIndex = pattern.lastIndexOf('/', wildcardIndex);

	return directorySeparatorIndex === -1 ? '**' : `${pattern.slice(0, directorySeparatorIndex)}/**`;
};

/**
Check whether an exports target has at least one exact-case file match.
*/
const hasMatchingExportTarget = (packageDirectory, value) => {
	const pattern = value.slice(2);

	if (!pattern.includes('*')) {
		return hasExactPath(packageDirectory, value, true);
	}

	try {
		return fs.globSync(getDotFilePattern(getExportScanPattern(pattern)), {
			cwd: packageDirectory,
		}).some(match => {
			const relativePath = match.replaceAll(path.sep, '/');

			return !invalidExportTargetPattern.test(relativePath)
				&& matchesExportPattern(relativePath, pattern)
				&& hasExactPath(packageDirectory, `./${relativePath}`, true);
		});
	} catch {
		return false;
	}
};

/**
Check whether a relative path or glob has at least one exact-case match in the package.
*/
const hasMatchingPath = (packageDirectory, value, requiresFile = false) => {
	if (!value.startsWith('./') || !isSafePackagePath(value.slice(2))) {
		return false;
	}

	return isGlobPattern(value)
		? hasMatchingGlob(packageDirectory, value.slice(2), requiresFile)
		: hasExactPath(packageDirectory, value, requiresFile);
};

/**
Get the package directory for a linted package.json, using the working directory for virtual filenames.
*/
const getPackageDirectory = context => {
	const {filename, cwd} = context;
	return filename.startsWith('<') ? cwd : path.dirname(path.resolve(cwd, filename));
};

/**
Create an export target checker that reports each missing target only once.
*/
const createExportChecker = (context, packageDirectory) => {
	const reportedTargets = new Set();

	const reportMissingTarget = node => {
		const {value} = node;

		if (!reportedTargets.has(value)) {
			reportedTargets.add(value);
			context.report({
				node,
				messageId: MESSAGE_ID_EXPORT,
				data: {value},
			});
		}
	};

	const check = (node, shouldReport = true, isPatternAllowed = false) => {
		switch (node.type) {
			case 'String': {
				const relativePath = node.value.slice(2);

				if (
					!node.value.startsWith('./')
					|| !relativePath
					|| !isSafePackagePath(relativePath)
					|| invalidExportTargetPattern.test(relativePath)
					|| (node.value.includes('*') && !isPatternAllowed)
				) {
					return {hasTarget: false, resolves: true};
				}

				const resolves = hasMatchingExportTarget(packageDirectory, node.value);

				if (!resolves && shouldReport) {
					reportMissingTarget(node);
				}

				return {hasTarget: true, resolves};
			}

			case 'Object': {
				const results = node.members.map(member => {
					const key = getKey(member);
					const childIsPatternAllowed = key.startsWith('.') ? key.includes('*') : isPatternAllowed;
					return check(member.value, shouldReport, childIsPatternAllowed);
				});
				const relevantResults = results.filter(result => result.hasTarget);

				return {
					hasTarget: relevantResults.length > 0,
					resolves: relevantResults.every(result => result.resolves),
				};
			}

			case 'Array': {
				const results = node.elements.map(element => check(element.value, false, isPatternAllowed));
				const relevantResults = results.filter(result => result.hasTarget);

				if (relevantResults.some(result => result.resolves)) {
					return {hasTarget: true, resolves: true};
				}

				if (shouldReport) {
					for (const element of node.elements) {
						check(element.value, true, isPatternAllowed);
					}
				}

				return {
					hasTarget: relevantResults.length > 0,
					resolves: relevantResults.length === 0,
				};
			}

			default: {
				return {hasTarget: false, resolves: true};
			}
		}
	};

	return check;
};

/** @param {import('eslint').Rule.RuleContext} context */
const create = context => ({
	Document(node) {
		const root = getRootObject(node);

		if (!root) {
			return;
		}

		const packageDirectory = getPackageDirectory(context);
		const exportsMember = findMember(root, 'exports');

		if (exportsMember) {
			createExportChecker(context, packageDirectory)(exportsMember.value);
		}

		const filesMember = findMember(root, 'files');

		if (filesMember?.value.type !== 'Array') {
			return;
		}

		for (const element of filesMember.value.elements) {
			const valueNode = element.value;

			if (valueNode.type !== 'String') {
				continue;
			}

			const {value} = valueNode;
			const relativePath = value.startsWith('./') ? value.slice(2) : value;

			if (
				value === ''
				|| value.startsWith('!')
				|| value.startsWith('/')
				|| windowsAbsolutePathPattern.test(value)
				|| !isSafePackagePath(relativePath)
			) {
				continue;
			}

			const packagePath = value.startsWith('./') ? value : `./${value}`;

			if (!hasMatchingPath(packageDirectory, packagePath)) {
				context.report({
					node: valueNode,
					messageId: MESSAGE_ID_FILES,
					data: {value},
				});
			}
		}
	},
});

/** @type {import('eslint').Rule.RuleModule} */
const config = {
	create,
	meta: {
		type: 'problem',
		docs: {
			description: 'Disallow missing files referenced by package metadata.',
			recommended: false,
		},
		schema: [],
		messages,
		languages: ['json/json'],
	},
};

export default config;
