import {findMember, validVersion} from '../utils/index.js';

const MESSAGE_ID = 'valid-package-manager';
const TYPE_MESSAGE_ID = 'type';

export const messages = {
	[MESSAGE_ID]: 'The `packageManager` field must be `npm`, `yarn`, `pnpm`, or `bun` at an exact version (e.g. `pnpm@9.1.0`).',
	[TYPE_MESSAGE_ID]: 'The `packageManager` field must be a string.',
};

// `name@version`. Ranges and tags like `latest` are left to SemVer to reject, which is also what catches the
// prerelease and build metadata a hand-rolled pattern would let through, such as the empty identifier in
// `1.0.0-alpha.`.
const pattern = /^(?:npm|yarn|pnpm|bun)@(.+)$/u;

export function * check(root) {
	const member = findMember(root, 'packageManager');

	if (!member) {
		return;
	}

	// Corepack reads the field as a string and throws on anything else, so a number or an object here is a
	// value no tool can act on rather than a version anyone pinned.
	if (member.value.type !== 'String') {
		yield {node: member.value, messageId: TYPE_MESSAGE_ID};
		return;
	}

	const version = pattern.exec(member.value.value)?.[1];

	// SemVer also accepts a `v` prefix and surrounding whitespace, which Corepack passes into the download URL as written, so the version must be exactly what SemVer normalizes it to. That normalization drops the build metadata, which is where Corepack's `+sha512.<hash>` checksum goes.
	if (version === undefined || validVersion(version) !== version.split('+', 1)[0]) {
		yield {
			node: member.value,
			messageId: MESSAGE_ID,
		};
	}
}
