import {
	findMember,
	removeElement,
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
	[EMPTY_MESSAGE_ID]: 'Keyword must not be empty or only whitespace.',
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

	if (keywords.value.type !== 'Array') {
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
			yield * removeElement(fixer, sourceCode, element);
		},
	});

	const seen = new Set();

	for (const element of keywords.value.elements) {
		const valueNode = element.value;

		if (valueNode.type !== 'String') {
			yield {
				node: valueNode,
				messageId: STRING_MESSAGE_ID,
			};
			continue;
		}

		const keyword = valueNode.value;

		if (keyword.trim() === '') {
			yield {
				node: valueNode,
				messageId: EMPTY_MESSAGE_ID,
				suggest: [removeSuggestion(element)],
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
				suggest: [removeSuggestion(element)],
			};
			continue;
		}

		if (keyword !== keyword.toLowerCase()) {
			yield {
				node: valueNode,
				messageId: LOWERCASE_MESSAGE_ID,
				data: {keyword},
				suggest: [
					{
						messageId: LOWERCASE_SUGGESTION_ID,
						fix: fixer => fixer.replaceText(valueNode, JSON.stringify(keyword.toLowerCase())),
					},
				],
			};
			continue;
		}

		if (seen.has(keyword)) {
			yield {
				node: valueNode,
				messageId: DUPLICATE_MESSAGE_ID,
				data: {keyword},
				suggest: [removeSuggestion(element)],
			};
			continue;
		}

		seen.add(keyword);
	}
}
