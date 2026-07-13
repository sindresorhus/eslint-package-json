import {
	findMember,
	removeMember,
	isHttpUrl,
	validRange,
} from '../utils/index.js';

const TYPE_MESSAGE_ID = 'type';
const ACCESS_MESSAGE_ID = 'access';
const REDUNDANT_ACCESS_MESSAGE_ID = 'redundantAccess';
const PROVENANCE_MESSAGE_ID = 'provenance';
const TAG_MESSAGE_ID = 'tag';
const REGISTRY_MESSAGE_ID = 'registry';
const REMOVE_SUGGESTION_ID = 'remove';

export const messages = {
	[TYPE_MESSAGE_ID]: 'The `publishConfig` field must be an object.',
	[ACCESS_MESSAGE_ID]: 'The `publishConfig.access` field must be "public" or "restricted".',
	[REDUNDANT_ACCESS_MESSAGE_ID]: '`publishConfig.access` has no effect for an unscoped package.',
	[PROVENANCE_MESSAGE_ID]: 'The `publishConfig.provenance` field must be a boolean.',
	[TAG_MESSAGE_ID]: 'The `publishConfig.tag` field must be a non-empty string that is not a valid SemVer range.',
	[REGISTRY_MESSAGE_ID]: 'The `publishConfig.registry` field must be a valid `http(s)` URL.',
	[REMOVE_SUGGESTION_ID]: 'Remove the `access` field.',
};

const validAccessValues = new Set(['public', 'restricted']);

export function * check(root, context) {
	const publishConfig = findMember(root, 'publishConfig');

	if (!publishConfig) {
		return;
	}

	if (publishConfig.value.type !== 'Object') {
		yield {
			node: publishConfig.value,
			messageId: TYPE_MESSAGE_ID,
		};
		return;
	}

	const access = findMember(publishConfig.value, 'access');

	if (access) {
		const name = findMember(root, 'name');
		const isUnscoped = name?.value.type === 'String' && !name.value.value.startsWith('@');

		if (!(access.value.type === 'String' && validAccessValues.has(access.value.value))) {
			yield {
				node: access.value,
				messageId: ACCESS_MESSAGE_ID,
			};
		} else if (isUnscoped) {
			// `access` is ignored by npm for unscoped packages (they are always public).
			yield {
				node: access.name,
				messageId: REDUNDANT_ACCESS_MESSAGE_ID,
				suggest: [
					{
						messageId: REMOVE_SUGGESTION_ID,
						* fix(fixer) {
							yield * removeMember(fixer, context.sourceCode, access);
						},
					},
				],
			};
		}
	}

	const provenance = findMember(publishConfig.value, 'provenance');

	if (provenance && provenance.value.type !== 'Boolean') {
		yield {
			node: provenance.value,
			messageId: PROVENANCE_MESSAGE_ID,
		};
	}

	const tag = findMember(publishConfig.value, 'tag');

	if (tag && (tag.value.type !== 'String' || tag.value.value === '' || validRange(tag.value.value) !== null)) {
		yield {
			node: tag.value,
			messageId: TAG_MESSAGE_ID,
		};
	}

	const registry = findMember(publishConfig.value, 'registry');

	if (registry && !(registry.value.type === 'String' && isHttpUrl(registry.value.value))) {
		yield {
			node: registry.value,
			messageId: REGISTRY_MESSAGE_ID,
		};
	}
}
