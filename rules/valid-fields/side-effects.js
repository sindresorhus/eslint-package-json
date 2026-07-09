import {findMember} from '../utils/index.js';

const TYPE_MESSAGE_ID = 'type';
const FOOTGUN_MESSAGE_ID = 'footgun';
const ELEMENT_MESSAGE_ID = 'element';

export const messages = {
	[TYPE_MESSAGE_ID]: 'The `sideEffects` field must be a boolean or an array of file globs.',
	[FOOTGUN_MESSAGE_ID]: 'The `sideEffects` field should be the boolean `{{value}}`, not the string `"{{value}}"`. A quoted boolean is always truthy, so it does not disable tree-shaking.',
	[ELEMENT_MESSAGE_ID]: 'Each `sideEffects` entry must be a file glob string.',
};

export function * check(root) {
	const sideEffects = findMember(root, 'sideEffects');

	if (!sideEffects) {
		return;
	}

	const {value} = sideEffects;

	if (value.type === 'Boolean') {
		return;
	}

	if (value.type === 'Array') {
		for (const element of value.elements) {
			if (element.value.type !== 'String') {
				yield {
					node: element.value,
					messageId: ELEMENT_MESSAGE_ID,
				};
			}
		}

		return;
	}

	// A boolean written as a string is truthy, silently disabling tree-shaking.
	if (value.type === 'String' && (value.value === 'true' || value.value === 'false')) {
		yield {
			node: value,
			messageId: FOOTGUN_MESSAGE_ID,
			data: {value: value.value},
			fix: fixer => fixer.replaceText(value, value.value),
		};
		return;
	}

	yield {
		node: value,
		messageId: TYPE_MESSAGE_ID,
	};
}
