import {findMember, isHttpUrl} from '../utils/index.js';

const MESSAGE_ID = 'valid-homepage';

export const messages = {
	[MESSAGE_ID]: 'The `homepage` field must be a valid `http(s)` URL.',
};

export function * check(root) {
	const homepage = findMember(root, 'homepage');

	if (!homepage) {
		return;
	}

	const {value} = homepage;

	if (value.type === 'String' && isHttpUrl(value.value)) {
		return;
	}

	yield {
		node: value,
		messageId: MESSAGE_ID,
	};
}
