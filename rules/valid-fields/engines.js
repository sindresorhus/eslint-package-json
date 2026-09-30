import {
	findMember,
	getKey,
	isFalsyValue,
	iterateEffectiveMembers,
	validRange,
} from '../utils/index.js';

const MESSAGE_ID = 'valid-engines';
const TYPE_MESSAGE_ID = 'type';
const VALUE_TYPE_MESSAGE_ID = 'valueType';

export const messages = {
	[MESSAGE_ID]: '`{{engine}}` has an invalid version range `{{range}}`.',
	[TYPE_MESSAGE_ID]: 'The `engines` field must be an object.',
	[VALUE_TYPE_MESSAGE_ID]: 'The `engines.{{engine}}` field must be a version range string.',
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

	// Effective members, since a shadowed duplicate is not a range npm ever hands to `semver.satisfies`.
	for (const member of iterateEffectiveMembers(engines.value)) {
		// Npm skips a falsy value, so it restricts nothing.
		if (isFalsyValue(member.value)) {
			continue;
		}

		// Npm hands any other `node` or `npm` value to `semver.satisfies`, which reads anything that is not a string range as a range nothing satisfies, so an install fails with EBADENGINE under `--engine-strict`. Other engines are read by other tools, which expect a range string too.
		if (member.value.type !== 'String') {
			yield {
				node: member.value,
				messageId: VALUE_TYPE_MESSAGE_ID,
				data: {engine: getKey(member)},
			};
			continue;
		}

		const range = member.value.value;

		// `validRange('')` is `'*'`, so an empty or blank range is one semver accepts and every version satisfies. It says nothing, which is not the same as malformed, so it is left alone here exactly as an empty `devEngines` version is.
		if (validRange(range) !== null) {
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
