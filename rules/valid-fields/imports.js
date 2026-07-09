import {
	findMember,
	getKey,
	checkConditionOrder,
	conditionOrderMessages,
} from '../utils/index.js';

const TYPE_MESSAGE_ID = 'type';
const KEY_MESSAGE_ID = 'key';

export const messages = {
	...conditionOrderMessages,
	[TYPE_MESSAGE_ID]: 'The `imports` field must be an object.',
	[KEY_MESSAGE_ID]: 'The `imports` key `{{key}}` must start with `#`.',
};

/**
Recursively check the condition objects nested within an `imports` entry value, yielding problems.
*/
function * checkImportsNode(node, sourceCode) {
	switch (node.type) {
		case 'Object': {
			yield * checkConditionOrder(sourceCode, node);

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

		// The conditions live in the entry values, so check those.
		for (const problem of checkImportsNode(member.value, sourceCode)) {
			yield problem;
		}
	}
}
