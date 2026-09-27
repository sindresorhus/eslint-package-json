import semver from 'semver';
import {findMember, canonicalVersion} from '../utils/index.js';

const MESSAGE_ID = 'valid-version';
const CANONICAL_MESSAGE_ID = 'canonical-version';
const TYPE_MESSAGE_ID = 'type';

export const messages = {
	[MESSAGE_ID]: '`{{version}}` is not a valid semver version.',
	[CANONICAL_MESSAGE_ID]: '`{{version}}` is not the canonical spelling of the version, which npm rewrites before it publishes. Write `{{canonical}}`.',
	[TYPE_MESSAGE_ID]: 'The `version` field must be a string.',
};

export function * check(root) {
	const member = findMember(root, 'version');

	if (!member) {
		return;
	}

	// Npm reads a version with `semver`, which rejects anything that is not a string, so a manifest declaring one cannot be published.
	if (member.value.type !== 'String') {
		yield {node: member.value, messageId: TYPE_MESSAGE_ID};
		return;
	}

	const version = member.value.value;
	// Npm reads a version with loose `semver` and refuses to publish one it cannot read. Loose reading accepts more than `semver.valid` does: `=1.0.0`, `01.0.0`, and `1.0.0beta` are published rewritten, while `V1.0.0` is refused.
	if (semver.valid(version, {loose: true}) === null) {
		yield {node: member.value, messageId: MESSAGE_ID, data: {version}};
		return;
	}

	const canonical = canonicalVersion(version);

	if (version === canonical) {
		return;
	}

	yield {
		node: member.value,
		messageId: CANONICAL_MESSAGE_ID,
		data: {version, canonical},
		fix: fixer => fixer.replaceText(member.value, JSON.stringify(canonical)),
	};
}
