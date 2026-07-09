import validateNpmPackageName from 'validate-npm-package-name';
import {findMember} from '../utils/index.js';

const MESSAGE_ID = 'valid-name';

export const messages = {
	[MESSAGE_ID]: 'Invalid package name: {{reason}}.',
};

export function * check(root) {
	const member = findMember(root, 'name');

	if (member?.value.type !== 'String') {
		return;
	}

	const result = validateNpmPackageName(member.value.value);

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
