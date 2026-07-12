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

/**
Check whether a relative path is safe to resolve inside the package directory.
*/
const isSafePackagePath = value => {
	const normalized = path.posix.normalize(value);
	return normalized !== '..'
		&& !normalized.startsWith('../')
		&& !value.split('/').includes('..');
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
Match one brace-expression segment of a glob pattern.
*/
const matchBraceExpression = ({valueSegment, patternSegment, valueIndex, patternIndex, match, matchesSegment}) => {
	const closingBrace = findClosingBrace(patternSegment, patternIndex);

	if (closingBrace === -1) {
		return valueIndex < valueSegment.length
			&& valueSegment[valueIndex] === patternSegment[patternIndex]
			&& match(valueIndex + 1, patternIndex + 1);
	}

	const alternatives = patternSegment.slice(patternIndex + 1, closingBrace).split(',');
	const suffix = patternSegment.slice(closingBrace + 1);

	if (alternatives.length > 1) {
		return alternatives.some(alternative => matchesSegment(valueSegment.slice(valueIndex), alternative + suffix));
	}

	return valueIndex < valueSegment.length
		&& valueSegment[valueIndex] === patternSegment[patternIndex]
		&& match(valueIndex + 1, patternIndex + 1);
};

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
Check whether a filesystem path matches a glob pattern with exact casing.
*/
const matchesGlobExactly = (value, pattern) => {
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

					case '{': {
						result = matchBraceExpression({
							valueSegment, patternSegment, valueIndex, patternIndex, match, matchesSegment,
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
Check whether a relative path or glob has at least one exact-case match in the package.
*/
const hasMatchingPath = (packageDirectory, value, requiresFile = false) => {
	if (!value.startsWith('./') || value.includes('\0') || !isSafePackagePath(value.slice(2))) {
		return false;
	}

	if (!hasGlob(value)) {
		return hasExactPath(packageDirectory, value, requiresFile);
	}

	const pattern = value.slice(2);

	try {
		const dotFilePattern = pattern.split('/').map(segment => segment.startsWith('.') || segment.startsWith('{') ? segment : `{.,}${segment}`).join('/');

		return fs.globSync(dotFilePattern, {
			cwd: packageDirectory,
		}).some(match => {
			if (!matchesGlobExactly(match, pattern)) {
				return false;
			}

			try {
				const statistics = fs.statSync(path.resolve(packageDirectory, match));
				return !requiresFile || statistics.isFile();
			} catch {
				return false;
			}
		});
	} catch {
		return false;
	}
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
					|| relativePath.split('/').includes('node_modules')
					|| (hasGlob(node.value) && !isPatternAllowed)
				) {
					return {hasTarget: false, resolves: true};
				}

				const resolves = hasMatchingPath(packageDirectory, node.value, true);

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

			if (
				valueNode.type !== 'String'
				|| valueNode.value === ''
				|| valueNode.value.includes('\0')
				|| valueNode.value.startsWith('!')
				|| valueNode.value.startsWith('/')
				|| valueNode.value.startsWith('../')
				|| windowsAbsolutePathPattern.test(valueNode.value)
				|| valueNode.value.includes('\\')
				|| !isSafePackagePath(valueNode.value.startsWith('./') ? valueNode.value.slice(2) : valueNode.value)
			) {
				continue;
			}

			const value = valueNode.value.startsWith('./') ? valueNode.value : `./${valueNode.value}`;

			if (!hasMatchingPath(packageDirectory, value)) {
				context.report({
					node: valueNode,
					messageId: MESSAGE_ID_FILES,
					data: {value: valueNode.value},
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
