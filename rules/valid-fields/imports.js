import {
	findMember,
	getKey,
	checkConditionOrder,
	conditionOrderMessages,
	hasInvalidPackageTargetSegment,
	isArrayIndexKey,
} from '../utils/index.js';

const TYPE_MESSAGE_ID = 'type';
const KEY_MESSAGE_ID = 'key';
const TARGET_TYPE_MESSAGE_ID = 'targetType';
const TARGET_VALUE_MESSAGE_ID = 'targetValue';
const CONDITION_KEY_MESSAGE_ID = 'conditionKey';

export const messages = {
	...conditionOrderMessages,
	[TYPE_MESSAGE_ID]: 'The `imports` field must be an object.',
	[KEY_MESSAGE_ID]: 'The `imports` key `{{key}}` must start with `#`.',
	[TARGET_TYPE_MESSAGE_ID]: 'An `imports` target must be a string, `null`, an object, or an array.',
	[TARGET_VALUE_MESSAGE_ID]: 'The `imports` target `{{value}}` is not a valid local path or package specifier.',
	[CONDITION_KEY_MESSAGE_ID]: 'Condition key `{{key}}` must not be an array index.',
};

const externalTargetPattern = /^(?:@[^/]+\/)?[^/]+(?:\/[^/]+)*$/u;

function isValidExternalTarget(value) {
	return (value.startsWith('node:') && value.length > 'node:'.length)
		|| (externalTargetPattern.test(value) && !value.startsWith('#') && !value.includes(':') && value.split('/').every(segment => !['.', '..', 'node_modules'].includes(segment)));
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
				|| value.includes('://')
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

/**
Recursively check the condition objects nested within an `imports` entry value, yielding problems.
*/
function * checkImportsNode(node, sourceCode) {
	switch (node.type) {
		case 'Object': {
			yield * checkConditionOrder(sourceCode, node, {checkDefault: false, checkTypes: false});

			for (const member of node.members) {
				yield * checkImportsNode(member.value, sourceCode);
			}

			break;
		}

		case 'Array': {
			for (const element of node.elements) {
				yield * checkImportsNode(element.value, sourceCode);
			}

			break;
		}
	// No default
	}
}

export function * check(root, context) {
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

	const {sourceCode} = context;

	for (const member of imports.value.members) {
		const key = getKey(member);

		// Top-level `imports` keys are subpaths and must start with `#`.
		if (!key.startsWith('#')) {
			yield {
				node: member.name,
				messageId: KEY_MESSAGE_ID,
				data: {key},
			};
		}

		yield * checkTargetNode(member.value);

		// The conditions live in the entry values, so check those.
		for (const problem of checkImportsNode(member.value, sourceCode)) {
			yield problem;
		}
	}
}
