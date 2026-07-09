import {findMember} from '../utils/index.js';

export const messages = {
	type: 'The `private` field must be a boolean.',
};

export function * check(root) {
	const member = findMember(root, 'private');

	if (!member) {
		return;
	}

	// A string like `"true"` is a common footgun: it is truthy but npm does not treat it as `private === true`, so the package can still be published.
	if (member.value.type !== 'Boolean') {
		yield {node: member.value, messageId: 'type'};
	}
}
