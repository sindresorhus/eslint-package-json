import {findMember, validRange} from '../utils/index.js';

const TYPE_MESSAGE_ID = 'type';
const FIELD_TYPE_MESSAGE_ID = 'fieldType';
const ELEMENT_TYPE_MESSAGE_ID = 'elementType';
const NAME_MESSAGE_ID = 'name';
const VERSION_MESSAGE_ID = 'version';
const ON_FAIL_MESSAGE_ID = 'onFail';

export const messages = {
	[TYPE_MESSAGE_ID]: 'The `devEngines` field must be an object.',
	[FIELD_TYPE_MESSAGE_ID]: 'The `devEngines.{{field}}` field must be an object or an array of objects.',
	[ELEMENT_TYPE_MESSAGE_ID]: 'Each `devEngines.{{field}}` element must be an object.',
	[NAME_MESSAGE_ID]: 'Each `devEngines.{{field}}` entry must have a string `name`.',
	[VERSION_MESSAGE_ID]: 'The `devEngines.{{field}}` `version` must be a valid version range string.',
	[ON_FAIL_MESSAGE_ID]: 'The `devEngines.{{field}}` `onFail` must be one of "ignore", "warn", "error", or "download".',
};

// The keys npm recognizes within `devEngines`.
const knownFields = ['runtime', 'packageManager', 'cpu', 'os', 'libc'];

const onFailValues = new Set(['ignore', 'warn', 'error', 'download']);

/**
Validate a single `devEngines` entry object, yielding problems.
*/
function * checkEntry(field, objectNode) {
	const name = findMember(objectNode, 'name');

	if (name?.value.type !== 'String') {
		yield {
			node: name?.value ?? objectNode,
			messageId: NAME_MESSAGE_ID,
			data: {field},
		};
	}

	const version = findMember(objectNode, 'version');

	// `validRange('')` is `'*'`, so an empty/whitespace version must be rejected explicitly.
	if (version && (version.value.type !== 'String' || version.value.value.trim() === '' || validRange(version.value.value) === null)) {
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

	for (const field of knownFields) {
		const member = findMember(devEngines.value, field);

		if (!member) {
			continue;
		}

		for (const problem of checkField(field, member.value)) {
			yield problem;
		}
	}
}
