import {findMember, isFalsyValue} from '../utils/index.js';

const TYPE_MESSAGE_ID = 'type';

export const messages = {
	[TYPE_MESSAGE_ID]: 'The `readme` field must be a string.',
};

export function * check(root) {
	const readme = findMember(root, 'readme');

	if (!readme) {
		return;
	}

	// Npm reads `readme` as the description source and calls `.trim()` on it when there is no `description` to use instead, so a non-string throws `description.trim is not a function` and the publish fails. With a `description` to use instead it is never read that way, and the value is published as written. A falsy value never gets that far either: npm replaces it with the README file or its own placeholder first, so it is not a type error.
	if (readme.value.type !== 'String' && !isFalsyValue(readme.value)) {
		yield {
			node: readme.value,
			messageId: TYPE_MESSAGE_ID,
		};
	}
}
