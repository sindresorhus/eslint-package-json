import {
	getRootObject,
	findMember,
	getKey,
	buildReordered,
	isSameOrder,
	pathFields,
	compareStrings,
} from './utils/index.js';

const MESSAGE_ID = 'sort-files';

const messages = {
	[MESSAGE_ID]: 'Entries in `files` should be in the canonical order.',
};

const declarationPathPattern = /^(.*)\.d\.(?:ts|mts|cts)$/u;

/**
Check whether an exports condition selects a TypeScript declaration target.
*/
const isTypesCondition = member => {
	const key = getKey(member);

	return key === 'types' || key.startsWith('types@');
};

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
		if (!isTypesCondition(member)) {
			yield * iterateExportsTargets(member.value);
		}
	}

	for (const member of node.members) {
		if (isTypesCondition(member)) {
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

	for (const field of pathFields) {
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

	return compareStrings(firstPathSortInfo.stem, secondPathSortInfo.stem)
		|| firstPathSortInfo.category - secondPathSortInfo.category
		|| compareStrings(firstPathSortInfo.path, secondPathSortInfo.path);
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
				fix: fixer => fixer.replaceText(filesMember.value, buildReordered(sourceCode, filesMember.value, orderedElements.map(element => element.value))),
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
			recommended: true,
		},
		fixable: 'code',
		schema: [],
		messages,
		languages: ['json/json'],
	},
};

export default config;
