import semver from 'semver';
import {findMember, getKey} from '../utils/index.js';

const MESSAGE_ID = 'valid-engines';
const TYPE_MESSAGE_ID = 'type';

export const messages = {
	[MESSAGE_ID]: '`{{engine}}` has an invalid version range `{{range}}`.',
	[TYPE_MESSAGE_ID]: 'The `engines` field must be an object.',
};

export function * check(root) {
	const engines = findMember(root, 'engines');

	if (!engines) {
		return;
	}

	if (engines.value.type !== 'Object') {
		yield {
			node: engines.value,
			messageId: TYPE_MESSAGE_ID,
		};
		return;
	}

	for (const member of engines.value.members) {
		if (member.value.type !== 'String') {
			continue;
		}

		const range = member.value.value;

		// `semver.validRange('')` is `'*'`, so reject empty/whitespace explicitly.
		if (range.trim() !== '' && semver.validRange(range) !== null) {
			continue;
		}

		yield {
			node: member.value,
			messageId: MESSAGE_ID,
			data: {
				engine: getKey(member),
				range,
			},
		};
	}
}
