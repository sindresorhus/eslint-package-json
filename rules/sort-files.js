import {
	getRootObject,
	findMember,
	getKey,
	getIndentString,
	getNewline,
	isSameOrder,
} from './utils/index.js';

const MESSAGE_ID = 'sort-files';

const messages = {
	[MESSAGE_ID]: 'Entries in `files` should be in the canonical order.',
};

const entryPointFields = [
	'main',
	'module',
	'browser',
	'types',
	'typings',
];

const declarationPathPattern = /^(.*)\.d\.(?:ts|mts|cts)$/u;

/**
Remove the optional `./` prefix used by entry-point fields so it can match a files entry.
*/
function getNormalizedPath(value) {
	return value.replace(/^\.\//u, '');
}

/**
Yield target paths from an exports tree, keeping declaration paths after their sibling runtime paths.
*/
function * iterateExportsTargets(node) {
	if (node.type === 'String') {
		yield node.value;
		return;
	}

	if (node.type === 'Array') {
		for (const element of node.elements) {
			yield * iterateExportsTargets(element.value);
		}

		return;
	}

	if (node.type !== 'Object') {
		return;
	}

	for (const member of node.members) {
		if (getKey(member) !== 'types') {
			yield * iterateExportsTargets(member.value);
		}
	}

	for (const member of node.members) {
		if (getKey(member) === 'types') {
			yield * iterateExportsTargets(member.value);
		}
	}
}

/**
Yield the package entry-point paths in their canonical order.
*/
function * iterateEntryPointTargets(root) {
	const exportsMember = findMember(root, 'exports');

	if (exportsMember) {
		yield * iterateExportsTargets(exportsMember.value);
	}

	for (const field of entryPointFields) {
		const member = findMember(root, field);

		if (member?.value.type === 'String') {
			yield member.value.value;
		}
	}

	const binMember = findMember(root, 'bin');

	if (binMember?.value.type === 'String') {
		yield binMember.value.value;
		return;
	}

	if (binMember?.value.type !== 'Object') {
		return;
	}

	for (const member of binMember.value.members) {
		if (member.value.type === 'String') {
			yield member.value.value;
		}
	}
}

/**
Map each entry-point path to its first appearance so repeated exports targets keep their primary position.
*/
function getEntryPointOrder(root) {
	const entryPointOrder = new Map();

	for (const target of iterateEntryPointTargets(root)) {
		const normalizedTarget = getNormalizedPath(target);

		if (!entryPointOrder.has(normalizedTarget)) {
			entryPointOrder.set(normalizedTarget, entryPointOrder.size);
		}
	}

	return entryPointOrder;
}

/**
Get the normalized path, declaration category, and shared stem used to compare a files entry.
*/
function getPathSortInfo(value) {
	const path = getNormalizedPath(value);
	const declarationMatch = declarationPathPattern.exec(path);

	if (declarationMatch) {
		return {
			path,
			stem: declarationMatch[1],
			category: 1,
		};
	}

	const lastSlashIndex = path.lastIndexOf('/');
	const lastPeriodIndex = path.lastIndexOf('.');

	if (lastPeriodIndex > lastSlashIndex + 1) {
		return {
			path,
			stem: path.slice(0, lastPeriodIndex),
			category: 0,
		};
	}

	return {
		path,
		stem: path,
		category: 0,
	};
}

/**
Compare files entries by entry-point priority, then path stem and declaration category.
*/
function compareFilesEntries(firstValue, secondValue, entryPointOrder) {
	const firstEntryPointOrder = entryPointOrder.get(getNormalizedPath(firstValue)) ?? Infinity;
	const secondEntryPointOrder = entryPointOrder.get(getNormalizedPath(secondValue)) ?? Infinity;

	if (firstEntryPointOrder !== secondEntryPointOrder) {
		return firstEntryPointOrder - secondEntryPointOrder;
	}

	const firstPathSortInfo = getPathSortInfo(firstValue);
	const secondPathSortInfo = getPathSortInfo(secondValue);

	return firstPathSortInfo.stem.localeCompare(secondPathSortInfo.stem)
		|| firstPathSortInfo.category - secondPathSortInfo.category
		|| firstPathSortInfo.path.localeCompare(secondPathSortInfo.path);
}

/**
Build a reordered files array while preserving the document's indentation and newline style.
*/
function buildReorderedArray(sourceCode, arrayNode, orderedElements, fallbackIndentation) {
	const newline = getNewline(sourceCode);
	const indentation = getIndentString(sourceCode);
	const firstElementStart = arrayNode.elements[0].value.range[0];
	const textBeforeFirstElement = sourceCode.text.slice(arrayNode.range[0] + 1, firstElementStart);
	const existingIndentation = textBeforeFirstElement.slice(textBeforeFirstElement.lastIndexOf('\n') + 1);
	const elementIndentation = existingIndentation.length > 0 ? existingIndentation : fallbackIndentation;
	const closingIndentation = elementIndentation.slice(indentation.length);

	return '['
		+ newline
		+ orderedElements.map(element => elementIndentation + sourceCode.getText(element.value)).join(',' + newline)
		+ newline
		+ closingIndentation
		+ ']';
}

/** @param {import('eslint').Rule.RuleContext} context */
const create = context => {
	const {sourceCode} = context;

	return {
		Document(node) {
			const root = getRootObject(node);

			if (!root) {
				return;
			}

			const filesMember = findMember(root, 'files');

			if (filesMember?.value.type !== 'Array') {
				return;
			}

			const {elements} = filesMember.value;

			if (elements.length < 2 || elements.some(element => element.value.type !== 'String' || element.value.value === '' || element.value.value.startsWith('!'))) {
				return;
			}

			const entryPointOrder = getEntryPointOrder(root);
			const orderedElements = elements.toSorted((firstElement, secondElement) => compareFilesEntries(firstElement.value.value, secondElement.value.value, entryPointOrder));

			if (isSameOrder(elements, orderedElements)) {
				return;
			}

			context.report({
				node: filesMember.value,
				messageId: MESSAGE_ID,
				fix: fixer => fixer.replaceText(filesMember.value, buildReorderedArray(sourceCode, filesMember.value, orderedElements, getIndentString(sourceCode).repeat(2))),
			});
		},
	};
};

/** @type {import('eslint').Rule.RuleModule} */
const config = {
	create,
	meta: {
		type: 'suggestion',
		docs: {
			description: 'Enforce a canonical order for entries in the `files` field.',
			recommended: false,
		},
		fixable: 'code',
		schema: [],
		messages,
		languages: ['json/json'],
	},
};

export default config;
