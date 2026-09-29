import {
	findMember,
	removeEntryAndEmptyContainer,
} from '../utils/index.js';

const TYPE_MESSAGE_ID = 'type';
const STRING_MESSAGE_ID = 'string';
const EMPTY_MESSAGE_ID = 'empty';
const SEPARATOR_MESSAGE_ID = 'separator';
const WHITESPACE_MESSAGE_ID = 'whitespace';
const NAME_MESSAGE_ID = 'name';
const LOWERCASE_MESSAGE_ID = 'lowercase';
const DUPLICATE_MESSAGE_ID = 'duplicate';
const REMOVE_SUGGESTION_ID = 'remove';
const LOWERCASE_SUGGESTION_ID = 'lowercaseFix';

export const messages = {
	[TYPE_MESSAGE_ID]: 'The `keywords` field must be an array.',
	[STRING_MESSAGE_ID]: 'Each keyword must be a string.',
	[EMPTY_MESSAGE_ID]: 'Keyword must not be empty; npm drops one.',
	[SEPARATOR_MESSAGE_ID]: 'Keyword `{{keyword}}` looks like several comma-separated keywords. Split it into separate entries.',
	[WHITESPACE_MESSAGE_ID]: 'Keyword `{{keyword}}` has leading or trailing whitespace.',
	[NAME_MESSAGE_ID]: 'Keyword `{{keyword}}` is redundant with the package name.',
	[LOWERCASE_MESSAGE_ID]: 'Keyword `{{keyword}}` should be lowercase.',
	[DUPLICATE_MESSAGE_ID]: 'Keyword `{{keyword}}` is duplicated.',
	[REMOVE_SUGGESTION_ID]: 'Remove this keyword.',
	[LOWERCASE_SUGGESTION_ID]: 'Convert to lowercase.',
};

export function * check(root, context) {
	const {sourceCode} = context;

	const keywords = findMember(root, 'keywords');

	if (!keywords) {
		return;
	}

	// Npm splits a string on `/,\s+/` and keeps the parts, so the comma-joined shorthand is a form it supports
	// and the same per-keyword checks read the parts it produces. An empty string leaves it with nothing.
	const isString = keywords.value.type === 'String';
	const elements = isString
		? keywords.value.value.split(/,\s+/u).map(keyword => ({value: keywords.value, keyword}))
		: (keywords.value.type === 'Array' ? keywords.value.elements : undefined);

	if (!elements) {
		yield {
			node: keywords.value,
			messageId: TYPE_MESSAGE_ID,
		};
		return;
	}

	const nameMember = findMember(root, 'name');
	const packageName = nameMember?.value.type === 'String' ? nameMember.value.value : undefined;

	const removeSuggestion = element => ({
		messageId: REMOVE_SUGGESTION_ID,
		* fix(fixer) {
			yield * removeEntryAndEmptyContainer(fixer, sourceCode, keywords, element);
		},
	});

	// A string has no element to remove and no single value to rewrite, so a joined list is reported without a
	// suggestion: removing one keyword or lowercasing one would drop the rest along with it.
	const withSuggestion = suggestion => (isString ? {} : {suggest: [suggestion]});

	const seen = new Set();
	const reported = new Set();

	for (const element of elements) {
		const valueNode = element.value;

		if (valueNode.type !== 'String') {
			yield {
				node: valueNode,
				messageId: STRING_MESSAGE_ID,
			};
			continue;
		}

		const keyword = element.keyword ?? valueNode.value;

		// Npm drops every keyword that is not a non-empty string, so an empty one never reaches the registry. One made of whitespace is published as written and belongs to the message below, which points at the padding.
		if (keyword === '') {
			yield {
				node: valueNode,
				messageId: EMPTY_MESSAGE_ID,
				...withSuggestion(removeSuggestion(element)),
			};
			continue;
		}

		if (keyword.includes(',')) {
			yield {
				node: valueNode,
				messageId: SEPARATOR_MESSAGE_ID,
				data: {keyword},
			};
			continue;
		}

		if (keyword !== keyword.trim()) {
			yield {
				node: valueNode,
				messageId: WHITESPACE_MESSAGE_ID,
				data: {keyword},
			};
			continue;
		}

		// Match case-insensitively so a miscased duplicate (`"Ky"` for name `"ky"`) is reported as redundant and removed, rather than first nudged to lowercase.
		if (packageName !== undefined && keyword.toLowerCase() === packageName.toLowerCase()) {
			yield {
				node: valueNode,
				messageId: NAME_MESSAGE_ID,
				data: {keyword},
				...withSuggestion(removeSuggestion(element)),
			};
			continue;
		}

		// The two reports below are the only ones a repeated keyword of a joined string can draw, and every part
		// of such a string is the same node, so only the first of them carries information. The keyword is
		// marked where the report is, not on entry, since whether it is a duplicate depends on where it came.
		if (isString && reported.has(keyword)) {
			continue;
		}

		if (keyword !== keyword.toLowerCase()) {
			reported.add(keyword);

			// A conversion that lands on a keyword the field already holds, in any casing, would create the
			// duplicate reported below rather than remove one, so nothing is offered when another entry is in
			// the way. Every part of a joined string shares one node, so it is the part that is compared rather
			// than the value behind it.
			const lowercase = keyword.toLowerCase();
			const collides = elements.some(other =>
				other !== element
				&& other.value.type === 'String'
				&& (other.keyword ?? other.value.value).toLowerCase() === lowercase);

			yield {
				node: valueNode,
				messageId: LOWERCASE_MESSAGE_ID,
				data: {keyword},
				...(!collides && withSuggestion({
					messageId: LOWERCASE_SUGGESTION_ID,
					fix: fixer => fixer.replaceText(valueNode, JSON.stringify(lowercase)),
				})),
			};
			continue;
		}

		if (seen.has(keyword)) {
			reported.add(keyword);

			yield {
				node: valueNode,
				messageId: DUPLICATE_MESSAGE_ID,
				data: {keyword},
				...withSuggestion(removeSuggestion(element)),
			};
			continue;
		}

		seen.add(keyword);
	}
}
