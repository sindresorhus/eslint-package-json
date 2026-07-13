import fs from 'node:fs';
import path from 'node:path';
import {
	findMember,
	getKey,
	getRootObject,
	hasGlob,
} from './utils/index.js';

const MESSAGE_ID_EXPORT = 'missingExportTarget';
const MESSAGE_ID_BIN = 'missingBinTarget';
const MESSAGE_ID_FILES = 'missingFilesPattern';

const messages = {
	[MESSAGE_ID_EXPORT]: 'Export target `{{value}}` does not exist.',
	[MESSAGE_ID_BIN]: '`bin` target `{{value}}` does not exist.',
	[MESSAGE_ID_FILES]: 'The `files` pattern `{{value}}` does not match any file or directory.',
};

const windowsAbsolutePathPattern = /^[a-z]:[/\\]/iu;
const atExtglobPattern = /@\(/u;
const absolutePathPattern = /^(?:\/|[a-z]:[/\\])/iu;
const invalidExportTargetPattern = /(?:^|\/)(?:\.{1,2}|node_modules)(?:\/|$)|%2e|%2f|%5c|(?:^|\/)%6eode_modules(?:\/|$)/iu;
const maximumPatternExpansions = 256;

const isGlobPattern = value => hasGlob(value) || atExtglobPattern.test(value);

/**
Check whether a relative path is safe to resolve inside the package directory.
*/
const isSafePackagePath = value => !value.startsWith('/')
	&& !value.includes('\0')
	&& !value.includes('\\')
	&& !value.split('/').includes('..');

/**
Check whether a literal relative path exists with the exact casing used in the path.
*/
const hasExactPath = (packageDirectory, value, requiresFile) => {
	const relativePath = value.slice(2);

	if (!relativePath) {
		return !requiresFile;
	}

	if (!isSafePackagePath(relativePath)) {
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
Split alternatives while preserving nested expressions.
*/
const splitAlternatives = (value, separator, openingCharacter, closingCharacter) => {
	const alternatives = [];
	let depth = 0;
	let startIndex = 0;

	for (let index = 0; index < value.length; index++) {
		if (value[index] === openingCharacter) {
			depth++;
		} else if (value[index] === closingCharacter) {
			depth--;
		} else if (value[index] === separator && depth === 0) {
			alternatives.push(value.slice(startIndex, index));
			startIndex = index + 1;
		}
	}

	alternatives.push(value.slice(startIndex));
	return alternatives;
};

/**
Find an expansion token outside a glob character class.
*/
const findExpansionToken = (value, token) => {
	let isInCharacterClass = false;

	for (let index = 0; index < value.length; index++) {
		if (value[index] === '[') {
			isInCharacterClass = true;
		} else if (value[index] === ']') {
			isInCharacterClass = false;
		} else if (!isInCharacterClass && value.startsWith(token, index)) {
			return index;
		}
	}

	return -1;
};

/**
Consume one bounded pattern-expansion step.
*/
const usePatternExpansionStep = expansionState => {
	expansionState.stepCount++;

	if (expansionState.stepCount > maximumPatternExpansions) {
		expansionState.isInvalid = true;
		return false;
	}

	return true;
};

/**
Lazily expand brace alternatives that span path segments.
*/
function * iterateBracePatterns(pattern, expansionState) {
	if (expansionState.isInvalid) {
		return;
	}

	const openingIndex = findExpansionToken(pattern, '{');

	if (openingIndex === -1) {
		yield pattern;
		return;
	}

	if (!usePatternExpansionStep(expansionState)) {
		return;
	}

	const closingIndex = findClosingBrace(pattern, openingIndex);

	if (closingIndex === -1) {
		expansionState.isInvalid = true;
		return;
	}

	const prefix = pattern.slice(0, openingIndex);
	const content = pattern.slice(openingIndex + 1, closingIndex);
	const suffix = pattern.slice(closingIndex + 1);
	const alternatives = splitAlternatives(content, ',', '{', '}');

	if (alternatives.length === 1) {
		for (const suffixPattern of iterateBracePatterns(suffix, expansionState)) {
			yield pattern.slice(0, closingIndex + 1) + suffixPattern;
		}

		return;
	}

	for (const alternative of alternatives) {
		yield * iterateBracePatterns(prefix + alternative + suffix, expansionState);
	}
}

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
Lazily expand simple `@()` extglobs.
*/
function * iterateAtExtglobPatterns(pattern, expansionState) {
	if (expansionState.isInvalid) {
		return;
	}

	const openingIndex = findExpansionToken(pattern, '@(');

	if (openingIndex === -1) {
		yield pattern;
		return;
	}

	if (!usePatternExpansionStep(expansionState)) {
		return;
	}

	const closingIndex = findClosingParenthesis(pattern, openingIndex + 1);

	if (closingIndex === -1) {
		expansionState.isInvalid = true;
		return;
	}

	const prefix = pattern.slice(0, openingIndex);
	const content = pattern.slice(openingIndex + 2, closingIndex);
	const suffix = pattern.slice(closingIndex + 1);

	for (const alternative of splitAlternatives(content, '|', '(', ')')) {
		yield * iterateAtExtglobPatterns(prefix + alternative + suffix, expansionState);
	}
}

/**
Expand supported glob alternatives within the work limit.
*/
const expandGlobPatterns = pattern => {
	const expansionState = {stepCount: 0, isInvalid: false};
	const patterns = [];

	for (const bracePattern of iterateBracePatterns(pattern, expansionState)) {
		for (const expandedPattern of iterateAtExtglobPatterns(bracePattern, expansionState)) {
			if (patterns.length === maximumPatternExpansions) {
				return undefined;
			}

			patterns.push(expandedPattern);
		}
	}

	return expansionState.isInvalid ? undefined : patterns;
};

/**
Check whether a glob pattern cannot expand to an absolute path.
*/
const isSafeGlobPattern = pattern => {
	const expandedPatterns = expandGlobPatterns(pattern);

	return Boolean(expandedPatterns?.length) && expandedPatterns.every(pattern => !absolutePathPattern.test(pattern));
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
	const expandedPatterns = expandGlobPatterns(pattern);

	if (!expandedPatterns) {
		return false;
	}

	if (expandedPatterns.length !== 1 || expandedPatterns[0] !== pattern) {
		return expandedPatterns.some(expandedPattern => matchesGlobExactly(value, expandedPattern));
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
	if (!isSafeGlobPattern(pattern)) {
		return false;
	}

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
Get the literal directory before the first export wildcard.
*/
const getExportScanDirectory = pattern => {
	const wildcardIndex = pattern.indexOf('*');
	const directorySeparatorIndex = pattern.lastIndexOf('/', wildcardIndex);

	return directorySeparatorIndex === -1 ? '' : pattern.slice(0, directorySeparatorIndex);
};

/**
Iterate files below an exports target's literal directory without scanning dependencies.
*/
function * iterateExportFiles(packageDirectory, relativeDirectory) {
	const directories = [relativeDirectory];

	while (directories.length > 0) {
		const directory = directories.pop();
		let entries;

		try {
			entries = fs.readdirSync(path.join(packageDirectory, directory), {withFileTypes: true});
		} catch {
			continue;
		}

		for (const entry of entries) {
			const relativePath = directory ? `${directory}/${entry.name}` : entry.name;

			if (entry.isDirectory()) {
				if (!invalidExportTargetPattern.test(relativePath)) {
					directories.push(relativePath);
				}
			} else if (entry.isFile() || hasExactPath(packageDirectory, `./${relativePath}`, true)) {
				yield relativePath;
			}
		}
	}
}

/**
Check whether an exports target has at least one exact-case file match.
*/
const hasMatchingExportTarget = (packageDirectory, value) => {
	const pattern = value.slice(2);

	if (!pattern.includes('*')) {
		return hasExactPath(packageDirectory, value, true);
	}

	const scanDirectory = getExportScanDirectory(pattern);

	if (scanDirectory && !hasExactPath(packageDirectory, `./${scanDirectory}`, false)) {
		return false;
	}

	for (const relativePath of iterateExportFiles(packageDirectory, scanDirectory)) {
		if (!invalidExportTargetPattern.test(relativePath) && matchesExportPattern(relativePath, pattern)) {
			return true;
		}
	}

	return false;
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
Report a missing `bin` target.
*/
const checkBinTarget = (context, packageDirectory, node) => {
	if (node.type !== 'String') {
		return;
	}

	const {value} = node;
	const relativePath = value.startsWith('./') ? value.slice(2) : value;

	if (
		!relativePath
		|| value.includes('://')
		|| windowsAbsolutePathPattern.test(relativePath)
		|| !isSafePackagePath(relativePath)
	) {
		return;
	}

	if (!hasExactPath(packageDirectory, `./${relativePath}`, true)) {
		context.report({
			node,
			messageId: MESSAGE_ID_BIN,
			data: {value},
		});
	}
};

/**
Check the string or object form of `bin`.
*/
const checkBin = (context, packageDirectory, root) => {
	const binMember = findMember(root, 'bin');

	if (binMember?.value.type === 'String') {
		checkBinTarget(context, packageDirectory, binMember.value);
	} else if (binMember?.value.type === 'Object') {
		for (const member of binMember.value.members) {
			checkBinTarget(context, packageDirectory, member.value);
		}
	}
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

		checkBin(context, packageDirectory, root);

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
				|| windowsAbsolutePathPattern.test(relativePath)
				|| !isSafePackagePath(relativePath)
				|| (isGlobPattern(value) && !isSafeGlobPattern(relativePath))
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
