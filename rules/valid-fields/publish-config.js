import {
	checkFieldType,
	findMember,
	removeEntryAndEmptyContainer,
	isHttpUrl,
	validRange,
} from '../utils/index.js';

const TYPE_MESSAGE_ID = 'type';
const ACCESS_MESSAGE_ID = 'access';
const UNSCOPED_RESTRICTED_MESSAGE_ID = 'unscopedRestricted';
const PROVENANCE_MESSAGE_ID = 'provenance';
const TAG_MESSAGE_ID = 'tag';
const REGISTRY_MESSAGE_ID = 'registry';
const REMOVE_SUGGESTION_ID = 'remove';

export const messages = {
	[TYPE_MESSAGE_ID]: 'The `publishConfig` field must be an object.',
	[ACCESS_MESSAGE_ID]: 'The `publishConfig.access` field must be "public" or "restricted".',
	// `libnpmpublish` throws `EUNSCOPED` for this, so the field stops the publish.
	[UNSCOPED_RESTRICTED_MESSAGE_ID]: '`publishConfig.access` cannot be "restricted" for an unscoped package; `npm publish` fails with `EUNSCOPED`.',
	[PROVENANCE_MESSAGE_ID]: 'The `publishConfig.provenance` field must be a boolean.',
	[TAG_MESSAGE_ID]: 'The `publishConfig.tag` field must be a non-empty string that is not a valid SemVer range.',
	[REGISTRY_MESSAGE_ID]: 'The `publishConfig.registry` field must be a valid `http(s)` URL.',
	[REMOVE_SUGGESTION_ID]: 'Remove the `access` field.',
};

const validAccessValues = new Set(['public', 'restricted']);

export function * check(root, context) {
	const publishConfig = yield * checkFieldType(root, 'publishConfig', 'Object');

	if (!publishConfig) {
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
		} else if (isUnscoped && access.value.value === 'restricted') {
			// `libnpmpublish` throws `EUNSCOPED` for a restricted unscoped package, so the publish fails. A `public` one is left alone: it is not redundant, because `libnpmpublish` throws `EUSAGE` for `provenance: true` on a first publish unless `access` is `public`.
			yield {
				node: access.name,
				messageId: UNSCOPED_RESTRICTED_MESSAGE_ID,
				suggest: [
					{
						messageId: REMOVE_SUGGESTION_ID,
						* fix(fixer) {
							yield * removeEntryAndEmptyContainer(fixer, context.sourceCode, publishConfig, access);
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

	// `validRange('')` is `'*'`, so an empty tag is rejected here too.
	if (tag && (tag.value.type !== 'String' || validRange(tag.value.value) !== null)) {
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
