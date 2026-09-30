import {
	dependencyTypes,
	findMember,
	getKey,
	iterateEffectiveMembers,
} from '../utils/index.js';

const GROUP_MESSAGE_ID = 'group';
const SPECIFIER_MESSAGE_ID = 'specifier';

export const messages = {
	[GROUP_MESSAGE_ID]: 'The `{{group}}` field must be an object.',
	[SPECIFIER_MESSAGE_ID]: 'The version of `{{name}}` in `{{group}}` must be a string.',
};

export function * check(root) {
	for (const group of dependencyTypes) {
		const member = findMember(root, group);

		if (!member) {
			continue;
		}

		if (member.value.type !== 'Object') {
			yield {
				node: member.value,
				messageId: GROUP_MESSAGE_ID,
				data: {group},
			};
			continue;
		}

		// Effective members, since the message is about the version npm reads, and a shadowed duplicate is not one it ever sees. The duplicate key itself is `json/no-duplicate-keys`' business.
		for (const dependency of iterateEffectiveMembers(member.value)) {
			if (dependency.value.type !== 'String') {
				yield {
					node: dependency.value,
					messageId: SPECIFIER_MESSAGE_ID,
					data: {name: getKey(dependency), group},
				};
			}
		}
	}
}
