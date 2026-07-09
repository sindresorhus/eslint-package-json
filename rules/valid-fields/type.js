import {findMember} from '../utils/index.js';

const MESSAGE_ID = 'valid-type';

export const messages = {
	[MESSAGE_ID]: 'The `type` field must be either "commonjs" or "module".',
};

const validTypes = new Set(['commonjs', 'module']);

export function * check(root) {
	const type = findMember(root, 'type');

	// Non-string values are left to other tooling.
	if (type?.value.type !== 'String') {
		return;
	}

	// An empty string is left to `no-empty-fields`.
	if (type.value.value === '' || validTypes.has(type.value.value)) {
		return;
	}

	yield {
		node: type.value,
		messageId: MESSAGE_ID,
	};
}
