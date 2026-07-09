import {findMember} from '../utils/index.js';

export const messages = {
	type: 'The `description` field must be a string.',
};

export function * check(root) {
	const member = findMember(root, 'description');

	if (!member) {
		return;
	}

	// An empty string is left to `no-empty-fields`; formatting is left to `description-format`.
	if (member.value.type !== 'String') {
		yield {node: member.value, messageId: 'type'};
	}
}
