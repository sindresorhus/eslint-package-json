import {getRootObject, findMember, getKey} from './utils/index.js';

const MESSAGE_ID = 'require-default-condition';
const MESSAGE_ID_NOT_LAST = 'defaultNotLast';

const messages = {
	[MESSAGE_ID]: 'A conditions object should include a `default` entry as a fallback.',
	[MESSAGE_ID_NOT_LAST]: 'The `default` condition must be the last entry in a conditions object.',
};

/**
Whether an object node holds conditions (keys like `import`/`node`) rather than subpaths. This distinction only applies to the top-level `exports` or `imports` object; nested objects are condition objects.
*/
function isConditionsObject(objectNode, subpathPrefix) {
	return objectNode.members.length > 0 && objectNode.members.every(member => !getKey(member).startsWith(subpathPrefix));
}

/**
Recursively yields condition objects that lack `default` or place it before another condition.
*/
function * checkNode(node, subpathPrefix, isRoot = true) {
	switch (node.type) {
		case 'Object': {
			if (!isRoot || isConditionsObject(node, subpathPrefix)) {
				const defaultIndex = node.members.findIndex(member => getKey(member) === 'default');

				if (defaultIndex === -1) {
					yield {node, messageId: MESSAGE_ID};
				} else if (defaultIndex !== node.members.length - 1) {
					yield {
						node: node.members[defaultIndex],
						messageId: MESSAGE_ID_NOT_LAST,
					};
				}
			}

			for (const member of node.members) {
				yield * checkNode(member.value, subpathPrefix, false);
			}

			break;
		}

		case 'Array': {
			for (const element of node.elements) {
				yield * checkNode(element.value, subpathPrefix, false);
			}

			break;
		}
	// No default
	}
}

/** @param {import('eslint').Rule.RuleContext} context */
const create = context => ({
	Document(node) {
		const root = getRootObject(node);

		if (!root) {
			return;
		}

		for (const [field, subpathPrefix] of [['exports', '.'], ['imports', '#']]) {
			const member = findMember(root, field);

			if (!member) {
				continue;
			}

			for (const problem of checkNode(member.value, subpathPrefix)) {
				context.report({
					node: problem.node,
					messageId: problem.messageId,
				});
			}
		}
	},
});

/** @type {import('eslint').Rule.RuleModule} */
const config = {
	create,
	meta: {
		type: 'suggestion',
		docs: {
			description: 'Require a last `default` entry in `exports`/`imports` conditions objects.',
			recommended: true,
		},
		schema: [],
		messages,
		languages: ['json/json'],
	},
};

export default config;
