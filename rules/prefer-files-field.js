import {
	getRootObject,
	findMember,
	isPrivatePackage,
	iterateEffectiveMembers,
	pathFields,
	hasGlob,
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

const automaticallyIncludedFields = new Set(['main', 'bin']);
const maximumCoverageComparisons = 1000;

// A leading `./` or `/` is stripped from a `files` pattern by npm, so `dist`, `./dist`, and `/dist` all name the same package-root directory. Entry-point targets never carry either prefix beyond `./`, so the same normalization serves both sides of a comparison.
function normalizePath(value) {
	return value.replace(/^(?:\.\/|\/)+/u, '');
}

function isPackagePath(value) {
	return value !== ''
		&& !value.includes('://')
		&& !value.startsWith('/')
		&& !value.startsWith('#')
		&& !value.split('/').includes('..')
		&& !hasInvalidPackageTargetSegment(value);
}

function * iterateEntryPoints(root) {
	const exports = findMember(root, 'exports');

	if (exports) {
		for (const value of iterateStringValues(withoutShadowedMembers(exports.value))) {
			if (isPackagePath(value.value)) {
				yield {node: value, field: 'exports', value: value.value};
			}
		}
	}

	for (const field of pathFields) {
		const member = findMember(root, field);

		if (member?.value.type === 'String' && isPackagePath(member.value.value)) {
			yield {node: member.value, field, value: member.value.value};
		}
	}

	const bin = findMember(root, 'bin');

	if (bin?.value.type === 'String' && isPackagePath(bin.value.value)) {
		yield {node: bin.value, field: 'bin', value: bin.value.value};
	} else if (bin?.value.type === 'Object') {
		// Effective members, since npm publishes only the final value per `bin` key; a shadowed duplicate is not an entry point.
		for (const member of iterateEffectiveMembers(bin.value)) {
			if (member.value.type === 'String' && isPackagePath(member.value.value)) {
				yield {node: member.value, field: 'bin', value: member.value.value};
			}
		}
	}
}

/**
Match one path segment against a pattern segment, where `*` stands for any run of characters within the segment.
*/
function matchesSegment(pattern, value) {
	const parts = pattern.split('*');

	if (parts.length === 1) {
		return pattern === value;
	}

	const first = parts[0];
	const last = parts.at(-1);

	if (first.length + last.length > value.length || !value.startsWith(first) || !value.endsWith(last)) {
		return false;
	}

	// The literals between the wildcards must appear in order, without overrunning the trailing literal.
	let index = first.length;
	for (const part of parts.slice(1, -1)) {
		const found = value.indexOf(part, index);

		if (found === -1) {
			return false;
		}

		index = found + part.length;
	}

	return index <= value.length - last.length;
}

/**
Match a `files` pattern against a package-relative path.

A single `*` never crosses a path separator, so the pattern is compared segment by segment. npm expands directories matched by wildcard patterns, so callers also check each ancestor directory. A `**` segment can match any number of path segments, while an embedded `**` is handled like an ordinary `*` within its segment.
*/
function matchesSimpleGlob(pattern, value) {
	const patternSegments = pattern.split('/');
	const valueSegments = value.split('/');
	const results = new Map();

	const match = (patternIndex, valueIndex) => {
		const key = `${patternIndex}:${valueIndex}`;

		if (results.has(key)) {
			return results.get(key);
		}

		let result;

		if (patternIndex === patternSegments.length) {
			result = valueIndex === valueSegments.length;
		} else if (patternSegments[patternIndex] === '**') {
			result = match(patternIndex + 1, valueIndex)
				|| (valueIndex < valueSegments.length && match(patternIndex, valueIndex + 1));
		} else {
			result = valueIndex < valueSegments.length
				&& matchesSegment(patternSegments[patternIndex], valueSegments[valueIndex])
				&& match(patternIndex + 1, valueIndex + 1);
		}

		results.set(key, result);
		return result;
	};

	return match(0, 0);
}

function isCovered(target, patterns) {
	const normalizedTarget = normalizePath(target);
	const targetPrefix = normalizedTarget.split('*', 1)[0].replace(/\/$/u, '');

	for (const pattern of patterns) {
		if (pattern === '.' || pattern === './') {
			return true;
		}

		const normalizedPattern = normalizePath(pattern).replace(/\/$/u, '');

		// Richer minimatch syntax is treated as unknown coverage because this JSON-only check cannot prove it.
		if (/[?[\]{}]/u.test(normalizedPattern)) {
			return true;
		}

		const patternForMatching = normalizedPattern.endsWith('/*') ? normalizedPattern + '*' : normalizedPattern;

		if (patternForMatching === '*' || patternForMatching === '**') {
			return true;
		}

		if (!hasGlob(patternForMatching)) {
			if (normalizedPattern === normalizedTarget || normalizedTarget.startsWith(normalizedPattern + '/')) {
				return true;
			}

			if (targetPrefix && (targetPrefix === normalizedPattern || targetPrefix.startsWith(normalizedPattern + '/'))) {
				return true;
			}
		}

		// `files` patterns are rooted at the package directory: `*.js` publishes `index.js` but not `lib/index.js`, so the whole path has to match, not just the file name.
		if (matchesSimpleGlob(patternForMatching, normalizedTarget)) {
			return true;
		}

		const targetSegments = normalizedTarget.split('/');
		for (let index = 1; index < targetSegments.length; index++) {
			const ancestor = targetSegments.slice(0, index).join('/');
			if (matchesSimpleGlob(patternForMatching, ancestor)) {
				return true;
			}
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
			if (automaticallyIncludedFields.has(entryPoint.field)) {
				automaticallyIncluded.add(normalizePath(entryPoint.value));
			}
		}

		for (const entryPoint of entryPoints) {
			if (automaticallyIncluded.has(normalizePath(entryPoint.value)) || isCovered(entryPoint.value, patterns)) {
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
