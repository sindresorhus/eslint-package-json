import fs from 'node:fs';
import path from 'node:path';
import {
	findMember,
	getKey,
	getRootObject,
	iterateEffectiveMembers,
	withoutShadowedMembers,
} from './utils/index.js';

const MESSAGE_ID_TARGET = 'missingTarget';
const MESSAGE_ID_FILES = 'missingFilesPattern';

const messages = {
	[MESSAGE_ID_TARGET]: '`{{field}}` target `{{value}}` does not resolve to a file in the package.',
	[MESSAGE_ID_FILES]: 'The `files` pattern `{{value}}` does not match any file or directory.',
};

const invalidExportTargetPattern = /(?:^|\/)(?:\.{1,2}|node_modules)(?:\/|$)/u;
// Node reads an `exports` or `imports` target as a URL, decoding its escapes and dropping a `?query` or a `#fragment` before it looks for the file. This rule does not model that, so it takes such a target to resolve.
const urlSyntaxPattern = /[#%?]/u;
// Npm 12 hands every `files` entry to `glob`. Character classes, extglobs, and brace ranges are glob features this rule does not match, a `\` is an escape there, and a `..` segment leaves the package, so an entry holding any of them is skipped.
const unsupportedFilesPattern = /[([\\]|\.\./u;
const maximumBraceGroups = 256;
// The conditions Node sets for every ES module consumer, so an array element keyed on one of them always yields a target and ends the walk. `require` is not among them: an ES module consumer skips it and falls through to the next element, and CommonJS consumers are out of scope.
const alwaysActiveNodeConditionKeys = new Set(['default', 'module-sync', 'node', 'node-addons', 'import']);

/**
Check whether a relative path is safe to resolve inside the package directory.
*/
const isSafePackagePath = value => !value.startsWith('/')
	&& !value.includes('\0')
	&& !value.includes('\\')
	&& !value.split('/').includes('..');

/**
Represent the package being linted, caching directory listings.

Resolving `exports`, `bin`, and `files` walks the same directories over and over, and each listing is a syscall, so every directory is read at most once per document.
*/
const createPackageDirectory = rootPath => {
	const cache = new Map();

	return {
		path: rootPath,

		// Lists a directory as a map of entry name to `Dirent`. A missing or unreadable directory simply has no entries, which is all callers need to know.
		readDirectory(directory) {
			let entries = cache.get(directory);

			if (!entries) {
				try {
					entries = new Map(fs.readdirSync(directory, {withFileTypes: true}).map(entry => [entry.name, entry]));
				} catch {
					entries = new Map();
				}

				cache.set(directory, entries);
			}

			return entries;
		},
	};
};

/**
Check whether a literal path relative to the package root exists with the exact casing used in the path. A trailing slash never names a file.
*/
const hasExactPath = (packageDirectory, relativePath, requiresFile) => {
	if (requiresFile && (relativePath === '' || relativePath.endsWith('/'))) {
		return false;
	}

	let currentDirectory = packageDirectory.path;
	let entry;

	for (const segment of relativePath.split('/')) {
		if (!segment || segment === '.') {
			continue;
		}

		entry = packageDirectory.readDirectory(currentDirectory).get(segment);

		if (!entry) {
			return false;
		}

		currentDirectory = path.join(currentDirectory, segment);
	}

	// The path was nothing but `.` segments, so it resolves to the package directory itself.
	if (!entry) {
		return !requiresFile;
	}

	// A `Dirent` describes the link itself, so a symlink still needs a `stat` to learn what it points at and whether it dangles.
	const isDirectory = entry.isDirectory();
	const isFile = entry.isFile();

	if (entry.isSymbolicLink() || (!isDirectory && !isFile)) {
		try {
			const statistics = fs.statSync(currentDirectory);
			return !requiresFile || statistics.isFile();
		} catch {
			return false;
		}
	}

	return !requiresFile || isFile;
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
Split the alternatives of a brace group, keeping nested groups whole.
*/
const splitAlternatives = value => {
	const alternatives = [];
	let depth = 0;
	let startIndex = 0;

	for (let index = 0; index < value.length; index++) {
		if (value[index] === '{') {
			depth++;
		} else if (value[index] === '}') {
			depth--;
		} else if (value[index] === ',' && depth === 0) {
			alternatives.push(value.slice(startIndex, index));
			startIndex = index + 1;
		}
	}

	alternatives.push(value.slice(startIndex));
	return alternatives;
};

/**
Expand the brace groups of a `files` pattern, or return `undefined` when it holds more groups than are worth checking. An unclosed group and one with a single alternative, such as `{a}`, stay literal, as they do for npm.
*/
const expandBraces = pattern => {
	const patterns = [];
	const pending = [[pattern, 0]];
	let groupCount = 0;

	while (pending.length > 0) {
		const [current, searchIndex] = pending.pop();
		const openingIndex = current.indexOf('{', searchIndex);
		const closingIndex = openingIndex === -1 ? -1 : findClosingBrace(current, openingIndex);

		if (closingIndex === -1) {
			patterns.push(current);
			continue;
		}

		groupCount++;

		if (groupCount > maximumBraceGroups) {
			return undefined;
		}

		const alternatives = splitAlternatives(current.slice(openingIndex + 1, closingIndex));

		if (alternatives.length === 1) {
			pending.push([current, closingIndex + 1]);
			continue;
		}

		for (const alternative of alternatives) {
			pending.push([current.slice(0, openingIndex) + alternative + current.slice(closingIndex + 1), openingIndex]);
		}
	}

	return patterns;
};

/**
Match one path segment against one glob segment, with exact casing. `*` also matches dotfiles, as npm's `files` handling does.
*/
const matchesSegment = (valueSegment, patternSegment) => {
	if (!patternSegment.includes('*') && !patternSegment.includes('?')) {
		return valueSegment === patternSegment;
	}

	// One memo slot per (value position, pattern position) pair, indexed arithmetically since this runs once per directory entry.
	const patternWidth = patternSegment.length + 1;
	const cache = [];

	const match = (valueIndex, patternIndex) => {
		const cacheKey = (valueIndex * patternWidth) + patternIndex;

		const cachedResult = cache[cacheKey];

		if (cachedResult !== undefined) {
			return cachedResult;
		}

		let result;

		if (patternIndex === patternSegment.length) {
			result = valueIndex === valueSegment.length;
		} else if (patternSegment[patternIndex] === '*') {
			result = match(valueIndex, patternIndex + 1)
				|| (valueIndex < valueSegment.length && match(valueIndex + 1, patternIndex));
		} else {
			result = valueIndex < valueSegment.length
				&& (patternSegment[patternIndex] === '?' || valueSegment[valueIndex] === patternSegment[patternIndex])
				&& match(valueIndex + 1, patternIndex + 1);
		}

		cache[cacheKey] = result;
		return result;
	};

	return match(0, 0);
};

/**
Check whether a directory entry matches the required type, following a symlink or an entry of unknown type with a `stat`.
*/
const isMatchingEntry = (entryPath, entry, requiresDirectory) => {
	if (entry.isDirectory()) {
		return true;
	}

	if (entry.isFile()) {
		return !requiresDirectory;
	}

	try {
		const statistics = fs.statSync(entryPath);
		return statistics.isDirectory() || (!requiresDirectory && statistics.isFile());
	} catch {
		return false;
	}
};

/**
Check whether a directory entry is a real directory without following symbolic links.
*/
const isRealDirectoryEntry = (entryPath, entry) => {
	if (entry.isDirectory()) {
		return true;
	}

	if (entry.isFile() || entry.isSymbolicLink()) {
		return false;
	}

	try {
		return fs.lstatSync(entryPath).isDirectory();
	} catch {
		return false;
	}
};

/**
Check whether anything below a directory matches the remaining glob segments, with exact casing.

The walk descends only where the pattern can still match and stops at the first match, so a globstar pattern costs a couple of directory listings rather than the whole tree. Names come from directory listings, so it can never resolve outside the package.
*/
const hasMatchingEntry = (packageDirectory, directory, segments, index) => {
	if (index === segments.length) {
		return true;
	}

	const segment = segments[index];
	const entries = packageDirectory.readDirectory(directory);

	if (segment === '**') {
		// `**` matches zero or more directories: try the rest of the pattern here, then in every real subdirectory. Symlinks are not followed here, so a link to an ancestor cannot loop.
		if (hasMatchingEntry(packageDirectory, directory, segments, index + 1)) {
			return true;
		}

		for (const entry of entries.values()) {
			const entryPath = path.join(directory, entry.name);

			if (isRealDirectoryEntry(entryPath, entry) && hasMatchingEntry(packageDirectory, entryPath, segments, index)) {
				return true;
			}
		}

		return false;
	}

	// Any entry satisfies the last segment, and so does one followed only by `**`, which npm 12 lets match nothing, so `index.js/**` publishes `index.js`. Every other segment has to be a directory to walk into.
	const isLastSegment = segments.slice(index + 1).every(rest => rest === '**');

	for (const entry of entries.values()) {
		if (!matchesSegment(entry.name, segment)) {
			continue;
		}

		const entryPath = path.join(directory, entry.name);

		if (isLastSegment) {
			if (isMatchingEntry(entryPath, entry, false)) {
				return true;
			}

			continue;
		}

		if (isMatchingEntry(entryPath, entry, true) && hasMatchingEntry(packageDirectory, entryPath, segments, index + 1)) {
			return true;
		}
	}

	return false;
};

/**
Check whether a normalized `files` pattern has an exact-case match in the package. A pattern with more brace groups than are worth expanding is taken to match.
*/
const hasMatchingPattern = (packageDirectory, pattern) => {
	const expandedPatterns = expandBraces(pattern);

	if (!expandedPatterns) {
		return true;
	}

	return expandedPatterns.some(expandedPattern => {
		// Npm 12 hands the pattern to `glob`, which reads `a//b` and `a/./b` as `a/b`, and `**/**` as `**`. Collapsing the repeated `**` also keeps the walk from multiplying with each one. An expansion that reduces to no path, such as `.` or the empty alternative in `{,a}`, names no file.
		const segments = expandedPattern.split('/')
			.filter(segment => segment !== '' && segment !== '.')
			.filter((segment, index, allSegments) => segment !== '**' || allSegments[index - 1] !== '**');
		return segments.length > 0 && hasMatchingEntry(packageDirectory, packageDirectory.path, segments, 0);
	});
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
		const entries = packageDirectory.readDirectory(path.join(packageDirectory.path, directory));

		for (const entry of entries.values()) {
			const relativePath = directory ? `${directory}/${entry.name}` : entry.name;
			let isDirectory = entry.isDirectory();
			let isFile = entry.isFile();

			if (!isDirectory && !isFile && !entry.isSymbolicLink()) {
				try {
					const statistics = fs.lstatSync(path.join(packageDirectory.path, relativePath));
					isDirectory = statistics.isDirectory();
					isFile = statistics.isFile();
				} catch {}
			}

			if (isDirectory) {
				if (!invalidExportTargetPattern.test(relativePath)) {
					directories.push(relativePath);
				}
			} else if (isFile || hasExactPath(packageDirectory, relativePath, true)) {
				yield relativePath;
			}
		}
	}
}

/**
Check whether an exports target, relative to the package root, has at least one exact-case file match.
*/
const hasMatchingExportTarget = (packageDirectory, pattern, isPatternAllowed) => {
	if (!pattern.includes('*')) {
		return hasExactPath(packageDirectory, pattern, true);
	}

	// A subpath key with no `*` has nothing to substitute, so the `*` in the target stays literal and the target is a plain file name. Npm refuses to pack any path holding a `*`, so even a file that is really there cannot ship, and looking it up would report a broken target as fine.
	if (!isPatternAllowed) {
		return false;
	}

	const scanDirectory = getExportScanDirectory(pattern);

	if (scanDirectory && !hasExactPath(packageDirectory, scanDirectory, false)) {
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
Get the package directory for a linted package.json, using the working directory for virtual filenames.
*/
const getPackageDirectory = context => {
	const {filename, cwd} = context;
	const rootPath = filename.startsWith('<') ? cwd : path.dirname(path.resolve(cwd, filename));

	return createPackageDirectory(rootPath);
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

	// Npm reads a `\` or a `:` in a `bin` target as a path separator, which this rule does not model, so such a target is skipped along with a URL and a Windows drive path.
	if (!relativePath || value.includes(':') || !isSafePackagePath(relativePath)) {
		return;
	}

	if (!hasExactPath(packageDirectory, relativePath, true)) {
		context.report({
			node,
			messageId: MESSAGE_ID_TARGET,
			data: {field: 'bin', value},
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
		// Effective members, so a shadowed duplicate's missing target is not reported: npm only installs the final value per key.
		for (const member of iterateEffectiveMembers(binMember.value)) {
			checkBinTarget(context, packageDirectory, member.value);
		}
	}
};

/**
Create an `exports` or `imports` target checker that reports each missing target only once.
*/
const createTargetChecker = (context, packageDirectory, field) => {
	const reportedTargets = new Set();

	const reportMissingTarget = node => {
		const {value} = node;

		if (!reportedTargets.has(value)) {
			reportedTargets.add(value);
			context.report({
				node,
				messageId: MESSAGE_ID_TARGET,
				data: {field, value},
			});
		}
	};

	/*
	Judge an array of targets. An array is not a fallback list: Node stops at the first element that yields a target path, and a missing file there is a hard failure rather than a cue to try the next element. It skips an element only when *resolution* fails (`null`, a target outside the package, a conditions object matching nothing).

	So the first element that always yields a target — a decisive one — decides the outcome, and everything after it is unreachable. An element that may yield nothing would let a later element apply, so an array headed by one of those stays permissive. Decisiveness is a property of the whole subtree, tracked as `isDecisive` on every result: a usable string target, an object whose `node` subtree has a target or whose `default` condition is decisive, or an array holding a decisive element.
	*/
	const checkArray = (node, results, shouldReport, isPatternAllowed) => {
		// One decisive element makes the whole array decisive: either an earlier element yields a target first, or iteration falls through to the decisive one, which always yields.
		const isDecisive = results.some(result => result.isDecisive);
		const firstDecisiveIndex = results.findIndex(result => result.isDecisive);
		const firstIndex = results.findIndex(result => result.hasTarget);

		if (firstIndex === -1) {
			return {hasTarget: false, resolves: true, isDecisive};
		}

		if (firstDecisiveIndex !== -1) {
			const firstDecisive = results[firstDecisiveIndex];

			if (!firstDecisive.resolves && shouldReport) {
				for (let index = 0; index <= firstDecisiveIndex; index++) {
					if (results[index].hasTarget && !results[index].resolves) {
						check(node.elements[index].value, true, isPatternAllowed);
					}
				}
			}

			return {hasTarget: true, resolves: firstDecisive.resolves, isDecisive};
		}

		if (results.some(result => result.hasTarget && result.resolves)) {
			return {hasTarget: true, resolves: true, isDecisive};
		}

		if (shouldReport) {
			for (const element of node.elements) {
				check(element.value, true, isPatternAllowed);
			}
		}

		return {hasTarget: true, resolves: false, isDecisive};
	};

	/**
	Check whether a target is unusable rather than merely absent. Node treats these as a failed *resolution*, which an enclosing array falls through, so they must be told apart from a target that simply is not on disk.
	*/
	const isUnusableTarget = value => {
		const relativePath = value.slice(2);

		return !value.startsWith('./')
			|| !isSafePackagePath(relativePath)
			|| invalidExportTargetPattern.test(relativePath);
	};

	const check = (node, shouldReport = true, isPatternAllowed = false) => {
		switch (node.type) {
			case 'String': {
				if (isUnusableTarget(node.value)) {
					return {hasTarget: false, resolves: true, isDecisive: false};
				}

				// A directory, including the bare `./` and anything ending in `/`, is refused by Node with `ERR_UNSUPPORTED_DIR_IMPORT` rather than falling through, so it is a decisive target that does not resolve.
				const resolves = urlSyntaxPattern.test(node.value)
					|| hasMatchingExportTarget(packageDirectory, node.value.slice(2), isPatternAllowed);

				if (!resolves && shouldReport) {
					reportMissingTarget(node);
				}

				return {hasTarget: true, resolves, isDecisive: true};
			}

			case 'Object': {
				const defaultIndex = node.members.findIndex(member => getKey(member) === 'default');
				const hasNullDefault = defaultIndex !== -1 && node.members[defaultIndex].value.type === 'Null';
				const results = node.members.map((member, index) => {
					const key = getKey(member);
					// A key that starts with `.` is an `exports` subpath and one that starts with `#` is an `imports` specifier. Both substitute the matched part for the target's `*`, so either enables it when the key carries one; every other key is a condition name and inherits the answer.
					const childIsPatternAllowed = key.startsWith('.') || key.startsWith('#') ? key.includes('*') : isPatternAllowed;
					const shouldReportChild = shouldReport && (!hasNullDefault || index < defaultIndex);
					return check(member.value, shouldReportChild, childIsPatternAllowed);
				});
				const relevantResults = results.filter((result, index) => result.hasTarget && (!hasNullDefault || index < defaultIndex));
				// Every other condition may match nothing, so an object yields a target unconditionally when `node` or `default` does or when a decisive branch precedes a `null` default. The tree is already free of shadowed duplicates, so at most one member holds the key.
				const decisiveIndex = node.members.findIndex((member, index) => {
					const key = getKey(member);
					return alwaysActiveNodeConditionKeys.has(key)
						&& results[index].isDecisive
						&& (!hasNullDefault || index < defaultIndex);
				});
				const hasDecisiveBranchBeforeNullDefault = hasNullDefault && results.some((result, index) => index < defaultIndex && result.isDecisive);

				return {
					hasTarget: relevantResults.length > 0,
					resolves: relevantResults.every(result => result.resolves),
					isDecisive: decisiveIndex !== -1 || hasDecisiveBranchBeforeNullDefault,
				};
			}

			case 'Array': {
				return checkArray(node, node.elements.map(element => check(element.value, false, isPatternAllowed)), shouldReport, isPatternAllowed);
			}

			default: {
				return {hasTarget: false, resolves: true, isDecisive: false};
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
		const importsMember = findMember(root, 'imports');

		// The question is which targets Node resolves, so the tree is walked as `JSON.parse` builds it: a shadowed duplicate neither satisfies a lookup nor deserves a missing-file report, since nothing ever resolves through it. An `imports` target is resolved exactly the way an `exports` target is, so the same checker answers both; only the top-level keys differ, and those are not looked at.
		if (exportsMember) {
			createTargetChecker(context, packageDirectory, 'exports')(withoutShadowedMembers(exportsMember.value));
		}

		if (importsMember) {
			// A key that is not a `#` specifier names a dependency. Node resolves such a specifier against the installed packages and never looks at the target, so no local path is named there.
			const imports = withoutShadowedMembers(importsMember.value);
			const localImports = imports.type === 'Object'
				? {...imports, members: imports.members.filter(member => getKey(member).startsWith('#'))}
				: imports;

			createTargetChecker(context, packageDirectory, 'imports')(localImports);
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
			// Npm 12 strips one leading `./` or `/` and every trailing slash before it expands an entry, so `/dist/` is `dist`, and `./` names nothing.
			const pattern = value.replace(/^\.?\//u, '').replace(/\/+$/u, '');

			if (
				value === ''
				|| value.startsWith('!')
				|| pattern.startsWith('/')
				|| unsupportedFilesPattern.test(pattern)
			) {
				continue;
			}

			if (!hasMatchingPattern(packageDirectory, pattern)) {
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
