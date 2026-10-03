import {checkFieldType, getKey, iterateEffectiveMembers} from '../utils/index.js';

const TYPE_MESSAGE_ID = 'type';
const VALUE_MESSAGE_ID = 'value';

export const messages = {
	[TYPE_MESSAGE_ID]: 'The `scripts` field must be an object.',
	[VALUE_MESSAGE_ID]: 'The `{{name}}` script must be a string.',
};

export function * check(root) {
	const scripts = yield * checkFieldType(root, 'scripts', 'Object');

	if (!scripts) {
		return;
	}

	// Effective members, since a shadowed duplicate is not a script npm ever runs.
	for (const member of iterateEffectiveMembers(scripts.value)) {
		if (member.value.type !== 'String') {
			yield {
				node: member.value,
				messageId: VALUE_MESSAGE_ID,
				data: {name: getKey(member)},
			};
		}
	}
}
