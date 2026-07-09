import {findMember} from '../utils/index.js';

const TYPE_MESSAGE_ID = 'type';
const PROPERTY_MESSAGE_ID = 'property';

export const messages = {
	[TYPE_MESSAGE_ID]: 'The `bugs` field must be a URL string or an object with `url`/`email`.',
	[PROPERTY_MESSAGE_ID]: 'The `bugs` `{{property}}` must be a string.',
};

export function * check(root) {
	const bugs = findMember(root, 'bugs');

	if (!bugs) {
		return;
	}

	const {value} = bugs;

	if (value.type === 'String') {
		return;
	}

	if (value.type !== 'Object') {
		yield {
			node: value,
			messageId: TYPE_MESSAGE_ID,
		};
		return;
	}

	for (const property of ['url', 'email']) {
		const member = findMember(value, property);

		if (member && member.value.type !== 'String') {
			yield {
				node: member.value,
				messageId: PROPERTY_MESSAGE_ID,
				data: {property},
			};
		}
	}
}
