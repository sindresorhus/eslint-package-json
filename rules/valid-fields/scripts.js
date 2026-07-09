import {findMember, getKey} from '../utils/index.js';

const TYPE_MESSAGE_ID = 'type';
const VALUE_MESSAGE_ID = 'value';

export const messages = {
	[TYPE_MESSAGE_ID]: 'The `scripts` field must be an object.',
	[VALUE_MESSAGE_ID]: 'The `{{name}}` script must be a string.',
};

export function * check(root) {
	const scripts = findMember(root, 'scripts');

	if (!scripts) {
		return;
	}

	if (scripts.value.type !== 'Object') {
		yield {
			node: scripts.value,
			messageId: TYPE_MESSAGE_ID,
		};
		return;
	}

	for (const member of scripts.value.members) {
		if (member.value.type !== 'String') {
			yield {
				node: member.value,
				messageId: VALUE_MESSAGE_ID,
				data: {name: getKey(member)},
			};
		}
	}
}
