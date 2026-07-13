import {
	findMember,
	getKey,
	hasInvalidPackageTargetSegment,
	isArrayIndexKey,
} from '../utils/index.js';

const TYPE_MESSAGE_ID = 'type';
const KEY_MESSAGE_ID = 'key';
const INVALID_KEY_MESSAGE_ID = 'invalidKey';
const TARGET_TYPE_MESSAGE_ID = 'targetType';
const TARGET_VALUE_MESSAGE_ID = 'targetValue';
const CONDITION_KEY_MESSAGE_ID = 'conditionKey';

export const messages = {
	[TYPE_MESSAGE_ID]: 'The `imports` field must be an object.',
	[KEY_MESSAGE_ID]: 'The `imports` key `{{key}}` must start with `#`.',
	[INVALID_KEY_MESSAGE_ID]: 'The `imports` key `{{key}}` is not a valid package subpath.',
	[TARGET_TYPE_MESSAGE_ID]: 'An `imports` target must be a string, `null`, an object, or an array.',
	[TARGET_VALUE_MESSAGE_ID]: 'The `imports` target `{{value}}` is not a valid local path or package specifier.',
	[CONDITION_KEY_MESSAGE_ID]: 'Condition key `{{key}}` must not be an array index.',
};

const externalTargetPattern = /^(?:@[^/]+\/)?[^/]+(?:\/[^/]+)*$/u;

function isValidExternalTarget(value) {
	if (!externalTargetPattern.test(value) || value.startsWith('#') || value.startsWith('.')) {
		return false;
	}

	try {
		decodeURIComponent(value);
	} catch {
		return false;
	}

	const packageName = value.startsWith('@')
		? value.split('/', 2).join('/')
		: value.split('/', 1)[0];

	return (!packageName.startsWith('@') || packageName.includes('/'))
		&& !value.includes('\\')
		&& !packageName.includes('%')
		&& !/%(?:2f|5c)/iu.test(value);
}

function isValidUrl(value) {
	return URL.canParse(value);
}

function isInvalidImportsKey(value) {
	if (value === '#') {
		return true;
	}

	const path = value.startsWith('#/') ? value.slice(2) : value.slice(1);
	return hasInvalidPackageTargetSegment('./' + path);
}

function * checkTargetNode(node) {
	switch (node.type) {
		case 'String': {
			const {value} = node;

			if (value.startsWith('./')) {
				if (hasInvalidPackageTargetSegment(value)) {
					yield {
						node,
						messageId: TARGET_VALUE_MESSAGE_ID,
						data: {value},
					};
				}

				break;
			}

			if (
				value === ''
				|| value.startsWith('/')
				|| value.startsWith('../')
				|| isValidUrl(value)
				|| !isValidExternalTarget(value)
			) {
				yield {
					node,
					messageId: TARGET_VALUE_MESSAGE_ID,
					data: {value},
				};
			}

			break;
		}

		case 'Object': {
			for (const member of node.members) {
				if (isArrayIndexKey(getKey(member))) {
					yield {
						node: member.name,
						messageId: CONDITION_KEY_MESSAGE_ID,
						data: {key: getKey(member)},
					};
				}
			}

			for (const member of node.members) {
				yield * checkTargetNode(member.value);
			}

			break;
		}

		case 'Array': {
			for (const element of node.elements) {
				yield * checkTargetNode(element.value);
			}

			break;
		}

		case 'Null': {
			break;
		}

		default: {
			yield {
				node,
				messageId: TARGET_TYPE_MESSAGE_ID,
			};
		}
	}
}

export function * check(root) {
	const imports = findMember(root, 'imports');

	if (!imports) {
		return;
	}

	if (imports.value.type !== 'Object') {
		yield {
			node: imports.value,
			messageId: TYPE_MESSAGE_ID,
		};
		return;
	}

	for (const member of imports.value.members) {
		const key = getKey(member);

		// Top-level `imports` keys are subpaths and must start with `#`.
		if (!key.startsWith('#')) {
			yield {
				node: member.name,
				messageId: KEY_MESSAGE_ID,
				data: {key},
			};
		} else if (isInvalidImportsKey(key)) {
			yield {
				node: member.name,
				messageId: INVALID_KEY_MESSAGE_ID,
				data: {key},
			};
		}

		yield * checkTargetNode(member.value);
	}
}
