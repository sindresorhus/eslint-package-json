import {findMember} from '../utils/index.js';

export const messages = {
	type: 'The `private` field must be a boolean.',
};

export function * check(root) {
	const member = findMember(root, 'private');

	if (!member) {
		return;
	}

	// A string like `"false"` is a common footgun, and npm's publish gate is truthiness, so it refuses to publish the package with `EPRIVATE` rather than publishing it. The value has to be the boolean the author meant, not a string that happens to be truthy or falsy.
	if (member.value.type !== 'Boolean') {
		yield {node: member.value, messageId: 'type'};
	}
}
