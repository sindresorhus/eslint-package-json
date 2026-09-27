import {findMember} from '../utils/index.js';

export const messages = {
	type: 'The `description` field must be a string.',
};

export function * check(root) {
	const member = findMember(root, 'description');

	if (!member) {
		return;
	}

	// An empty string is left to `no-empty-fields`; formatting is left to `description-format`. Npm deletes a truthy non-string description, and fills one in from the README when the field is falsy and there is a README to take it from. Without one, a `null` is published as `null`, which is not the value npm rejects and not one anything reads as text, so it is left alone.
	if (member.value.type !== 'String' && member.value.type !== 'Null') {
		yield {node: member.value, messageId: 'type'};
	}
}
