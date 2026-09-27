import {findMember} from '../utils/index.js';

const TYPE_MESSAGE_ID = 'type';
const FOOTGUN_MESSAGE_ID = 'footgun';
const ELEMENT_MESSAGE_ID = 'element';
const CONVERT_SUGGESTION_ID = 'convert';

export const messages = {
	[TYPE_MESSAGE_ID]: 'The `sideEffects` field must be a boolean or an array of file globs.',
	[FOOTGUN_MESSAGE_ID]: 'The `sideEffects` field should be the boolean `{{value}}`, not the string `"{{value}}"`. Bundlers read a string as a glob or ignore it, not as the boolean.',
	[ELEMENT_MESSAGE_ID]: 'Each `sideEffects` entry must be a file glob string.',
	[CONVERT_SUGGESTION_ID]: 'Replace with the boolean `{{value}}`.',
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

	// A boolean written as a string is not the boolean: webpack reads it as a glob (`"true"` matches no module, so every module is treated as side-effect free) and esbuild ignores it.
	if (value.type === 'String' && (value.value === 'true' || value.value === 'false')) {
		yield {
			node: value,
			messageId: FOOTGUN_MESSAGE_ID,
			data: {value: value.value},
			suggest: [
				{
					messageId: CONVERT_SUGGESTION_ID,
					data: {value: value.value},
					fix: fixer => fixer.replaceText(value, value.value),
				},
			],
		};
		return;
	}

	yield {
		node: value,
		messageId: TYPE_MESSAGE_ID,
	};
}
