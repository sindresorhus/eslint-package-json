import path from 'node:path';
import {
	getRootObject,
	findMember,
	isAlwaysIncludedFile,
	isPrivatePackage,
	iterateEffectiveMembers,
	pathFields,
	hasInvalidPackageTargetSegment,
	iterateStringValues,
	withoutShadowedMembers,
} from './utils/index.js';

const MESSAGE_ID = 'prefer-files-field';
const MESSAGE_ID_UNCOVERED = 'uncovered';

const messages = {
	[MESSAGE_ID]: 'Add a `files` allowlist so only intended files are published.',
	[MESSAGE_ID_UNCOVERED]: 'Entry point `{{value}}` is not covered by the `files` allowlist.',
};

const automaticallyIncludedFields = new Set(['main', 'browser', 'bin']);
const literallyIncludedFields = new Set(['main', 'browser']);
const maximumCoverageComparisons = 1000;

// Npm 12 strips one leading `./` or `/` from a `files` pattern, so `dist`, `./dist`, and `/dist` all name the same package-root directory, while `//dist` stays absolute and publishes nothing. Entry-point targets never carry either prefix beyond `./`, so the same normalization serves both sides of a comparison.
function normalizePath(value) {
	return value.replace(/^\.?\//u, '');
}

/**
Whether a value names a file inside this package, so a `files` entry is what decides whether it ships.

`isBareSpecifierPossible` is set for a `browser` replacement-map value, which is a module specifier as often as a path. A bare specifier names a file inside a dependency rather than one in this package, and no `files` entry can cover it, so it is not an entry point at all. `{"browser": {"path": "path-browserify"}}` is the everyday shape that says so; a value that is a path is written `./path`.
*/
function isPackagePath(value, isBareSpecifierPossible) {
	if (isBareSpecifierPossible && !value.startsWith('./')) {
		return false;
	}

	return value !== ''
		&& !value.includes('://')
		&& !value.startsWith('/')
		&& !value.startsWith('#')
		&& !value.split('/').includes('..')
		&& !hasInvalidPackageTargetSegment(value);
}

/**
Yield the entry points a field's object form names. Both `bin` and a `browser` replacement map hold `name -> path` members, and npm leaves those paths out of the tarball when `files` misses them. A non-string value names no file, and a shadowed duplicate is not an entry point because npm publishes only the final value per key.
*/
function * iterateObjectEntryPoints(member, field) {
	for (const child of iterateEffectiveMembers(member.value)) {
		if (child.value.type === 'String' && isPackagePath(child.value.value, field === 'browser')) {
			yield {node: child.value, field, value: child.value.value};
		}
	}
}

function * iterateEntryPoints(root) {
	// `imports` is left out: its targets are often used only by tests or dev tooling, and `no-missing-files` checks that they exist.
	const exportsMember = findMember(root, 'exports');

	if (exportsMember) {
		for (const value of iterateStringValues(withoutShadowedMembers(exportsMember.value))) {
			if (isPackagePath(value.value, false)) {
				yield {node: value, field: 'exports', value: value.value};
			}
		}
	}

	for (const field of pathFields) {
		const member = findMember(root, field);

		if (member?.value.type === 'String' && isPackagePath(member.value.value, false)) {
			yield {node: member.value, field, value: member.value.value};
		} else if (field === 'browser' && member?.value.type === 'Object') {
			// The object form is a replacement map, so its values are the module files a bundler resolves to.
			yield * iterateObjectEntryPoints(member, field);
		}
	}

	const bin = findMember(root, 'bin');

	if (bin?.value.type === 'String' && isPackagePath(bin.value.value, false)) {
		yield {node: bin.value, field: 'bin', value: bin.value.value};
	} else if (bin?.value.type === 'Object') {
		yield * iterateObjectEntryPoints(bin, 'bin');
	}
}

// A `*` inside a `files` segment matches within that segment, while a `*` in an `exports` target and a `**` segment in `files` match across `/`.
const segmentWildcard = Symbol('segment wildcard');
const anyWildcard = Symbol('any wildcard');
// Marks a `**/` in a `files` pattern, which matches either nothing or a run of whole segments. It is followed by an `anyWildcard` and a `/`, and it lets the match skip both.
const globstar = Symbol('globstar');

/**
Split a normalized `files` pattern into literal characters and wildcards.
*/
function tokenizeFilesPattern(segments) {
	return segments.flatMap((segment, index) => {
		const separator = index === segments.length - 1 ? [] : ['/'];

		if (segment === '**') {
			return index === segments.length - 1 ? [anyWildcard] : [globstar, anyWildcard, ...separator];
		}

		// A run of `*`, including an embedded `**`, matches like one `*` within its segment.
		const tokens = [...segment.replaceAll(/\*+/gu, '*')].map(character => character === '*' ? segmentWildcard : character);
		return [...tokens, ...separator];
	});
}

/**
Split a normalized entry-point target into literal characters and wildcards. Node substitutes any string, `/` included, for a `*` in a subpath pattern target.
*/
function tokenizeTarget(target) {
	return [...target.replaceAll(/\*+/gu, '*')].map(character => character === '*' ? anyWildcard : character);
}

const isWildcard = token => typeof token === 'symbol';

/**
Check whether some path matches both token lists.

Two wildcards never need to consume a character together, since dropping that character from the path keeps both matches, so a step either skips a wildcard, lets one wildcard consume the other side's literal, or pairs two equal literals. Memoizing the positions keeps it polynomial however many wildcards either side holds.
*/
function canMatchSamePath(left, right) {
	const results = new Map();

	const visit = (leftIndex, rightIndex) => {
		const key = (leftIndex * (right.length + 1)) + rightIndex;

		if (results.has(key)) {
			return results.get(key);
		}

		const leftToken = left[leftIndex];
		const rightToken = right[rightIndex];
		const canConsume = (wildcard, character) => wildcard !== segmentWildcard || character !== '/';
		let result;

		if (leftIndex === left.length && rightIndex === right.length) {
			result = true;
		} else if (leftToken === globstar) {
			result = visit(leftIndex + 1, rightIndex) || visit(leftIndex + 3, rightIndex);
		} else if ((isWildcard(leftToken) && visit(leftIndex + 1, rightIndex)) || (isWildcard(rightToken) && visit(leftIndex, rightIndex + 1))) {
			result = true;
		} else if (leftToken === undefined || rightToken === undefined || (isWildcard(leftToken) && isWildcard(rightToken))) {
			result = false;
		} else if (isWildcard(leftToken)) {
			result = canConsume(leftToken, rightToken) && visit(leftIndex, rightIndex + 1);
		} else if (isWildcard(rightToken)) {
			result = canConsume(rightToken, leftToken) && visit(leftIndex + 1, rightIndex);
		} else {
			result = leftToken === rightToken && visit(leftIndex + 1, rightIndex + 1);
		}

		results.set(key, result);
		return result;
	};

	return visit(0, 0);
}

/**
Check whether some `files` entry may publish a file the target names.

The target and each entry are compared as patterns, so a wildcard target such as `./dist/*.js` is covered by `dist/index.js`, `dist/*.js`, or `dist/**` alike, but not by `dist/index.d.ts` or `dist/*.css`. Npm also publishes everything beneath a directory an entry matches. Which entries name directories is not in the manifest, so an entry whose last segment has a file extension is taken to name a file, unless the target's own literal path runs through it.
*/
function isCovered(target, patterns) {
	const normalizedTarget = normalizePath(target);
	const targetTokens = tokenizeTarget(normalizedTarget);
	const literalPrefix = normalizedTarget.split('*', 1)[0];

	for (const pattern of patterns) {
		const normalizedPattern = normalizePath(pattern).replace(/\/+$/u, '');

		// An entry naming the package root, or one still absolute after npm strips a single leading `/`, publishes nothing.
		if (normalizedPattern === '' || normalizedPattern === '.' || normalizedPattern.startsWith('/')) {
			continue;
		}

		// Richer minimatch syntax is treated as unknown coverage because this JSON-only check cannot prove it: character classes, and the extglobs `@(a|b)`, `+(a|b)`, `*(a|b)`, `?(a|b)` and the negated `!(a|b)`.
		if (/[?[\]{}]|[!*+@]\(/u.test(normalizedPattern)) {
			return true;
		}

		// `glob` reads `a//b` and `a/./b` as `a/b`.
		const segments = normalizedPattern.split('/').filter(segment => segment !== '' && segment !== '.');
		const patternTokens = tokenizeFilesPattern(segments);

		if (canMatchSamePath(patternTokens, targetTokens)) {
			return true;
		}

		const isDirectory = !/.\./u.test(segments.at(-1)) || literalPrefix.startsWith(`${segments.join('/')}/`);

		if (isDirectory && canMatchSamePath([...patternTokens, '/', anyWildcard], targetTokens)) {
			return true;
		}
	}

	return false;
}

/** @param {import('eslint').Rule.RuleContext} context */
const create = context => ({
	Document(node) {
		const root = getRootObject(node);

		if (!root || isPrivatePackage(root)) {
			return;
		}

		const files = findMember(root, 'files');

		if (!files) {
			context.report({
				node: root,
				messageId: MESSAGE_ID,
			});
			return;
		}

		if (files.value.type !== 'Array' || files.value.elements.some(element => element.value.type !== 'String')) {
			return;
		}

		const patterns = files.value.elements.map(element => element.value.value);

		// Negations are order-sensitive and cannot be proven safe from package.json alone.
		if (patterns.some(pattern => pattern.startsWith('!'))) {
			return;
		}

		const entryPoints = [...iterateEntryPoints(root)];

		if (entryPoints.length * patterns.length > maximumCoverageComparisons) {
			return;
		}

		const automaticallyIncluded = new Set();

		for (const entryPoint of entryPoints) {
			if (!automaticallyIncludedFields.has(entryPoint.field)) {
				continue;
			}

			// `main` and a string `browser` are force-included through a strict `!/<value>` rule built from the literal value, and npm normalizes neither, so a `./` or `../` prefix names a different path and npm publishes nothing. A leading `/` is left out too: an absolute entry point is `no-absolute-paths`' business, and a `files` allowlist cannot cover it either way. A `browser` replacement map is the exception: npm builds the same strict rule from the raw field value, so the object stringifies to `[object Object]` and includes none of its values.
			if (entryPoint.field === 'browser' && findMember(root, 'browser')?.value.type !== 'String') {
				continue;
			}

			if (literallyIncludedFields.has(entryPoint.field) && /^\.{0,2}\//u.test(entryPoint.value)) {
				continue;
			}

			// `bin` is the exception: npm normalizes each target before packing, so a `./` prefix is stripped and the file is still included. Compare it in the same form as the lookup.
			automaticallyIncluded.add(entryPoint.field === 'bin' ? normalizePath(entryPoint.value) : entryPoint.value);
		}

		// Node resolves an extensionless `main` by trying extensions and `index` files, which this JSON-only check does not model, so it is never reported.
		const reportableEntryPoints = entryPoints.filter(entryPoint => entryPoint.field !== 'main' || path.posix.extname(entryPoint.value) !== '');

		for (const entryPoint of reportableEntryPoints) {
			if (isAlwaysIncludedFile(entryPoint.value) || automaticallyIncluded.has(normalizePath(entryPoint.value)) || isCovered(entryPoint.value, patterns)) {
				continue;
			}

			context.report({
				node: entryPoint.node,
				messageId: MESSAGE_ID_UNCOVERED,
				data: {value: entryPoint.value},
			});
		}
	},
});

/** @type {import('eslint').Rule.RuleModule} */
const config = {
	create,
	meta: {
		type: 'suggestion',
		docs: {
			description: 'Require a `files` allowlist that covers published entry points.',
			recommended: true,
		},
		schema: [],
		messages,
		languages: ['json/json'],
	},
};

export default config;
