import {
	findMember,
	getKey,
	iterateEffectiveMembers,
	validRange,
} from '../utils/index.js';

const TYPE_MESSAGE_ID = 'type';
const FIELD_TYPE_MESSAGE_ID = 'fieldType';
const ELEMENT_TYPE_MESSAGE_ID = 'elementType';
const NAME_MESSAGE_ID = 'name';
const VERSION_MESSAGE_ID = 'version';
const ON_FAIL_MESSAGE_ID = 'onFail';
const UNKNOWN_FIELD_MESSAGE_ID = 'unknownField';
const UNKNOWN_PROPERTY_MESSAGE_ID = 'unknownProperty';

export const messages = {
	[TYPE_MESSAGE_ID]: 'The `devEngines` field must be an object.',
	[FIELD_TYPE_MESSAGE_ID]: 'The `devEngines.{{field}}` field must be an object or an array of objects.',
	[ELEMENT_TYPE_MESSAGE_ID]: 'Each `devEngines.{{field}}` element must be an object.',
	[NAME_MESSAGE_ID]: 'Each `devEngines.{{field}}` entry must have a string `name`.',
	[VERSION_MESSAGE_ID]: 'The `devEngines.{{field}}` `version` must be a valid version range string.',
	[ON_FAIL_MESSAGE_ID]: 'The `devEngines.{{field}}` `onFail` must be one of "ignore", "warn", "error", or "download".',
	[UNKNOWN_FIELD_MESSAGE_ID]: '`devEngines.{{field}}` is not a `devEngines` engine npm recognizes; npm refuses to install dependencies or run scripts in a project that declares one.',
	[UNKNOWN_PROPERTY_MESSAGE_ID]: '`devEngines.{{field}}` has an `{{property}}` property npm does not recognize; npm refuses to install dependencies or run scripts in a project that declares one.',
};

// The keys npm recognizes within `devEngines`.
const knownFields = new Set(['runtime', 'packageManager', 'cpu', 'os', 'libc']);

const onFailValues = new Set(['ignore', 'warn', 'error', 'download']);

// The properties npm recognizes within a `devEngines` entry.
const knownProperties = new Set(['name', 'version', 'onFail']);

/**
Validate a single `devEngines` entry object, yielding problems.
*/
function * checkEntry(field, objectNode) {
	// Npm refuses to install dependencies or run scripts in the project when an entry carries a property it does not recognize.
	for (const member of iterateEffectiveMembers(objectNode)) {
		const property = getKey(member);

		if (!knownProperties.has(property)) {
			yield {
				node: member.name,
				messageId: UNKNOWN_PROPERTY_MESSAGE_ID,
				data: {field, property},
			};
		}
	}

	const name = findMember(objectNode, 'name');

	if (name?.value.type !== 'String') {
		yield {
			node: name?.value ?? objectNode,
			messageId: NAME_MESSAGE_ID,
			data: {field},
		};
	}

	const version = findMember(objectNode, 'version');

	// Npm reads the range with `semver.satisfies`, which reads an empty one as `'*'`, so an empty version
	// installs exactly as a missing one would.
	if (version && (version.value.type !== 'String' || validRange(version.value.value) === null)) {
		yield {
			node: version.value,
			messageId: VERSION_MESSAGE_ID,
			data: {field},
		};
	}

	const onFail = findMember(objectNode, 'onFail');

	if (onFail && !(onFail.value.type === 'String' && onFailValues.has(onFail.value.value))) {
		yield {
			node: onFail.value,
			messageId: ON_FAIL_MESSAGE_ID,
			data: {field},
		};
	}
}

/**
Validate a recognized `devEngines` field, which is either an entry object or an array of entry objects.
*/
function * checkField(field, valueNode) {
	if (valueNode.type === 'Object') {
		yield * checkEntry(field, valueNode);
		return;
	}

	if (valueNode.type === 'Array') {
		for (const element of valueNode.elements) {
			if (element.value.type === 'Object') {
				yield * checkEntry(field, element.value);
			} else {
				yield {
					node: element.value,
					messageId: ELEMENT_TYPE_MESSAGE_ID,
					data: {field},
				};
			}
		}

		return;
	}

	yield {
		node: valueNode,
		messageId: FIELD_TYPE_MESSAGE_ID,
		data: {field},
	};
}

export function * check(root) {
	const devEngines = findMember(root, 'devEngines');

	if (!devEngines) {
		return;
	}

	if (devEngines.value.type !== 'Object') {
		yield {
			node: devEngines.value,
			messageId: TYPE_MESSAGE_ID,
		};
		return;
	}

	// Npm refuses to install dependencies or run scripts in the project when `devEngines` names an engine it does not recognize, so an unknown key is a hard failure rather than an inert typo. It checks only the project it runs in, never a package being installed as a dependency.
	for (const member of iterateEffectiveMembers(devEngines.value)) {
		const field = getKey(member);

		if (!knownFields.has(field)) {
			yield {
				node: member.name,
				messageId: UNKNOWN_FIELD_MESSAGE_ID,
				data: {field},
			};
			continue;
		}

		yield * checkField(field, member.value);
	}
}
