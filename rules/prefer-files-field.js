import {
	getRootObject,
	findMember,
	isPrivatePackage,
	pathFields,
	hasGlob,
	hasInvalidPackageTargetSegment,
} from './utils/index.js';

const MESSAGE_ID = 'prefer-files-field';
const MESSAGE_ID_UNCOVERED = 'uncovered';

const messages = {
	[MESSAGE_ID]: 'Add a `files` allowlist so only intended files are published.',
	[MESSAGE_ID_UNCOVERED]: 'Entry point `{{value}}` is not covered by the `files` allowlist.',
};

const automaticallyIncludedFields = new Set(['main', 'bin']);

function normalizePath(value) {
	return value.replace(/^\.\//u, '');
}

function isPackagePath(value) {
	return value !== ''
		&& !value.includes('://')
		&& !value.startsWith('/')
		&& !value.startsWith('#')
		&& !value.split('/').includes('..')
		&& !hasInvalidPackageTargetSegment(value);
}

function * iterateStringValues(node) {
	switch (node.type) {
		case 'String': {
			yield node;
			break;
		}

		case 'Object': {
			for (const member of node.members) {
				yield * iterateStringValues(member.value);
			}

			break;
		}

		case 'Array': {
			for (const element of node.elements) {
				yield * iterateStringValues(element.value);
			}

			break;
		}
	// No default
	}
}

function * iterateEntryPoints(root) {
	const exports = findMember(root, 'exports');

	if (exports) {
		for (const value of iterateStringValues(exports.value)) {
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
		for (const member of bin.value.members) {
			if (member.value.type === 'String' && isPackagePath(member.value.value)) {
				yield {node: member.value, field: 'bin', value: member.value.value};
			}
		}
	}
}

function matchesSimpleGlob(pattern, value) {
	let expression = '';

	for (let index = 0; index < pattern.length; index++) {
		const character = pattern[index];

		if (character === '*') {
			if (pattern[index + 1] === '*' && pattern[index + 2] === '/') {
				expression += '(?:.*/)?';
				index += 2;
			} else if (pattern[index + 1] === '*') {
				expression += '.*';
				index++;
			} else {
				expression += '[^/]*';
			}
		} else {
			expression += character.replaceAll(/[$()*+.?[\\\]^{|}]/gu, String.raw`\$&`);
		}
	}

	return new RegExp(`^${expression}$`, 'u').test(value);
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

		const globTarget = patternForMatching.includes('/') ? normalizedTarget : normalizedTarget.split('/').at(-1);

		if (matchesSimpleGlob(patternForMatching, globTarget)) {
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

		const automaticallyIncluded = new Set();

		for (const entryPoint of iterateEntryPoints(root)) {
			if (automaticallyIncludedFields.has(entryPoint.field)) {
				automaticallyIncluded.add(normalizePath(entryPoint.value));
			}
		}

		for (const entryPoint of iterateEntryPoints(root)) {
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
