import validateNpmPackageName from 'validate-npm-package-name';
import {findMember} from '../utils/index.js';

const MESSAGE_ID = 'valid-name';
const TYPE_MESSAGE_ID = 'type';

export const messages = {
	[MESSAGE_ID]: 'Invalid package name: {{reason}}.',
	[TYPE_MESSAGE_ID]: 'The `name` field must be a string.',
};

/*
`validateNpmPackageName` percent-encodes the name to look for characters that are not URL-friendly, and `encodeURIComponent` throws a `URIError` on a lone surrogate. A lone surrogate is still a legal JSON string escape, so report the same reason the validator would have instead of letting the throw escape the rule.
*/
const validateName = name => {
	try {
		return validateNpmPackageName(name);
	} catch {
		return {validForNewPackages: false, errors: ['name can only contain URL-friendly characters']};
	}
};

export function * check(root) {
	const member = findMember(root, 'name');

	if (!member) {
		return;
	}

	// `npm publish` throws `name field must be a string`, so a non-string name cannot be published at all.
	if (member.value.type !== 'String') {
		yield {node: member.value, messageId: TYPE_MESSAGE_ID};
		return;
	}

	const result = validateName(member.value.value);

	if (result.validForNewPackages) {
		return;
	}

	// An invalid name always has at least one error or warning; `'invalid'` is a defensive fallback.
	const reason = result.errors?.[0] ?? result.warnings?.[0] ?? 'invalid';

	yield {
		node: member.value,
		messageId: MESSAGE_ID,
		data: {reason},
	};
}
