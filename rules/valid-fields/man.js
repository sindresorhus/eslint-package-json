import {findMember} from '../utils/index.js';

const TYPE_MESSAGE_ID = 'type';
const ELEMENT_MESSAGE_ID = 'element';
const EXTENSION_MESSAGE_ID = 'extension';

export const messages = {
	[TYPE_MESSAGE_ID]: 'The `man` field must be a string or an array of strings.',
	[ELEMENT_MESSAGE_ID]: 'Each `man` entry must be a string.',
	[EXTENSION_MESSAGE_ID]: 'The `man` file `{{value}}` must end in a man-section extension (for example `.1`, optionally `.gz`).',
};

// A man page filename ends in a numeric section, optionally gzipped.
const manExtensionPattern = /\.\d+(?:\.gz)?$/;

function * checkPath(node) {
	if (node.type !== 'String') {
		yield {
			node,
			messageId: ELEMENT_MESSAGE_ID,
		};
		return;
	}

	if (!manExtensionPattern.test(node.value)) {
		yield {
			node,
			messageId: EXTENSION_MESSAGE_ID,
			data: {value: node.value},
		};
	}
}

export function * check(root) {
	const man = findMember(root, 'man');

	if (!man) {
		return;
	}

	if (man.value.type === 'String') {
		yield * checkPath(man.value);
		return;
	}

	if (man.value.type !== 'Array') {
		yield {
			node: man.value,
			messageId: TYPE_MESSAGE_ID,
		};
		return;
	}

	for (const element of man.value.elements) {
		yield * checkPath(element.value);
	}
}
