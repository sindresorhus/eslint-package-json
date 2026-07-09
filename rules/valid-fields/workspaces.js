import {findMember} from '../utils/index.js';

const TYPE_MESSAGE_ID = 'type';
const ELEMENT_MESSAGE_ID = 'element';

export const messages = {
	[TYPE_MESSAGE_ID]: 'The `workspaces` field must be an array of globs.',
	[ELEMENT_MESSAGE_ID]: 'Each `workspaces` entry must be a string.',
};

export function * check(root) {
	const workspaces = findMember(root, 'workspaces');

	if (!workspaces) {
		return;
	}

	const {value} = workspaces;

	// Yarn classic's `{packages, nohoist}` object form is accepted as-is.
	if (value.type === 'Object') {
		return;
	}

	if (value.type !== 'Array') {
		yield {
			node: value,
			messageId: TYPE_MESSAGE_ID,
		};
		return;
	}

	for (const element of value.elements) {
		if (element.value.type !== 'String') {
			yield {
				node: element.value,
				messageId: ELEMENT_MESSAGE_ID,
			};
		}
	}
}
