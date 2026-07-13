import {findMember, validVersion} from '../utils/index.js';

const MESSAGE_ID = 'valid-version';

export const messages = {
	[MESSAGE_ID]: '`{{version}}` is not a valid semver version.',
};

export function * check(root) {
	const member = findMember(root, 'version');

	if (member?.value.type !== 'String') {
		return;
	}

	const version = member.value.value;
	const isValidSemver = validVersion(version) !== null;

	// A canonical package.json version has no `v` prefix and no surrounding whitespace, even though semver tolerates both. Build metadata (`+build`) is preserved, so we don't compare against the normalized form.
	if (isValidSemver && version === version.trim() && !/^v/i.test(version)) {
		return;
	}

	yield {
		node: member.value,
		messageId: MESSAGE_ID,
		data: {version},
		// Strip the `v` prefix and surrounding whitespace by hand rather than `semver.clean()`, which also drops build metadata (`+build`) that must be preserved.
		fix: isValidSemver
			? fixer => fixer.replaceText(member.value, JSON.stringify(version.trim().replace(/^v/, '')))
			: undefined,
	};
}
