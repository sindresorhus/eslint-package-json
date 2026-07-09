import {findMember} from '../utils/index.js';

const MESSAGE_ID = 'valid-package-manager';

export const messages = {
	[MESSAGE_ID]: 'The `packageManager` field must be `npm`, `yarn`, `pnpm`, or `bun` at an exact version (e.g. `pnpm@9.1.0`).',
};

// `name@x.y.z`, optional prerelease and optional `+hash`. Ranges and tags like `latest` are rejected.
const pattern = /^(?:npm|yarn|pnpm|bun)@\d+\.\d+\.\d+(?:-[\w\-.]+)?(?:\+[\w\-.]+)?$/;

export function * check(root) {
	const member = findMember(root, 'packageManager');

	if (member?.value.type !== 'String') {
		return;
	}

	if (!pattern.test(member.value.value)) {
		yield {
			node: member.value,
			messageId: MESSAGE_ID,
		};
	}
}
