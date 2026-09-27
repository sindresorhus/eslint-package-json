import {
	findMember,
	getKey,
	hasInvalidPackageTargetSegment,
	isArrayIndexKey,
	tryDecodeUriComponent,
	withoutShadowedMembers,
} from '../utils/index.js';

const TYPE_MESSAGE_ID = 'type';
const KEY_MESSAGE_ID = 'key';
const INVALID_KEY_MESSAGE_ID = 'invalidKey';
const TARGET_TYPE_MESSAGE_ID = 'targetType';
const TARGET_VALUE_MESSAGE_ID = 'targetValue';
const CONDITION_KEY_MESSAGE_ID = 'conditionKey';
const NESTED_KEY_MESSAGE_ID = 'nestedKey';

export const messages = {
	[TYPE_MESSAGE_ID]: 'The `imports` field must be an object.',
	[KEY_MESSAGE_ID]: 'The `imports` key `{{key}}` must start with `#`.',
	[INVALID_KEY_MESSAGE_ID]: 'The `imports` key `{{key}}` must not be a bare `#`.',
	[TARGET_TYPE_MESSAGE_ID]: 'An `imports` target must be a string, `null`, an object, or an array.',
	[TARGET_VALUE_MESSAGE_ID]: 'The `imports` target `{{value}}` is not a valid local path or package specifier.',
	[CONDITION_KEY_MESSAGE_ID]: 'Condition key `{{key}}` must not be an array index.',
	[NESTED_KEY_MESSAGE_ID]: 'The `imports` key `{{key}}` is read as a condition name, not as a specifier, so the branch is only reached by a consumer that passes that condition explicitly.',
};

const externalTargetPattern = /^(?:@[^/]+\/)?[^/]+(?:\/[^/]+)*$/u;

function isValidExternalTarget(value) {
	if (!externalTargetPattern.test(value) || value.startsWith('#') || value.startsWith('.')) {
		return false;
	}

	if (tryDecodeUriComponent(value) === undefined) {
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
				const key = getKey(member);

				// Only the top level of `imports` maps a `#` key to a target. Nested in a conditions
				// object Node reads a `#` key as a condition name like any other, so the branch is only
				// reached when a consumer passes that name to `--conditions`, which nothing does by
				// default.
				if (key.startsWith('#')) {
					yield {
						node: member.name,
						messageId: NESTED_KEY_MESSAGE_ID,
						data: {key},
					};
				} else if (isArrayIndexKey(key)) {
					yield {
						node: member.name,
						messageId: CONDITION_KEY_MESSAGE_ID,
						data: {key},
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

	// Collapsed the way `JSON.parse` builds the tree, so a shadowed duplicate is not checked as a target Node
	// never resolves. The surviving members are the original nodes, so reports still point at real ranges.
	const value = withoutShadowedMembers(imports.value);

	if (value.type !== 'Object') {
		yield {
			node: value,
			messageId: TYPE_MESSAGE_ID,
		};
		return;
	}

	for (const member of value.members) {
		const key = getKey(member);

		// Top-level `imports` keys are subpaths and must start with `#`.
		if (!key.startsWith('#')) {
			yield {
				node: member.name,
				messageId: KEY_MESSAGE_ID,
				data: {key},
			};
		} else if (key === '#') {
			// Node matches an `imports` key literally and validates only the target, so a `.`, `..`, or `node_modules` segment in a key resolves fine. A bare `#` is the one key shape that is a hard error of its own. A trailing slash, the deprecated folder mapping, is `no-exports-trailing-slash`' report.
			yield {
				node: member.name,
				messageId: INVALID_KEY_MESSAGE_ID,
				data: {key},
			};
		}

		yield * checkTargetNode(member.value);
	}
}
