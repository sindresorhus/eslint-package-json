import {findMember, getKey} from '../utils/index.js';

const TYPE_MESSAGE_ID = 'type';
const VALUE_MESSAGE_ID = 'value';

export const messages = {
	[TYPE_MESSAGE_ID]: 'The `overrides` field must be an object.',
	[VALUE_MESSAGE_ID]: 'The `{{name}}` override must be a version string or a nested overrides object.',
};

/**
Recursively check each override entry: a leaf must be a version string, otherwise it is a nested overrides object.
*/
function * checkOverrides(objectNode) {
	for (const member of objectNode.members) {
		const {value} = member;

		if (value.type === 'Object') {
			yield * checkOverrides(value);
		} else if (value.type !== 'String') {
			yield {
				node: value,
				messageId: VALUE_MESSAGE_ID,
				data: {name: getKey(member)},
			};
		}
	}
}

export function * check(root) {
	const overrides = findMember(root, 'overrides');

	if (!overrides) {
		return;
	}

	if (overrides.value.type !== 'Object') {
		yield {
			node: overrides.value,
			messageId: TYPE_MESSAGE_ID,
		};
		return;
	}

	for (const problem of checkOverrides(overrides.value)) {
		yield problem;
	}
}
