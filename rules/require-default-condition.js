import {
	getRootObject,
	findMember,
	getKey,
	withoutShadowedMembers,
} from './utils/index.js';

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
function * checkNode(node, subpathPrefix, isRoot = true, isCovered = false) {
	switch (node.type) {
		case 'Object': {
			const isConditions = !isRoot || isConditionsObject(node, subpathPrefix);
			const defaultIndex = isConditions ? node.members.findIndex(member => getKey(member) === 'default') : -1;

			if (isConditions) {
				if (defaultIndex === -1) {
					if (!isCovered) {
						yield {node, messageId: MESSAGE_ID};
					}
				} else if (defaultIndex !== node.members.length - 1) {
					yield {
						node: node.members[defaultIndex],
						messageId: MESSAGE_ID_NOT_LAST,
					};
				}
			}

			for (const [index, member] of node.members.entries()) {
				// A nested conditions object that matches nothing resolves to nothing, and Node moves on to the next sibling condition, so a `default` after it, here or in an enclosing conditions object, covers everything it does not.
				yield * checkNode(member.value, subpathPrefix, false, isCovered || index < defaultIndex);
			}

			break;
		}

		case 'Array': {
			for (const [index, element] of node.elements.entries()) {
				// A fallback list is the fallback. Node resolves an element that matches no condition to
				// nothing and moves on to the next one, so an element that is not last needs no `default` of its
				// own; the last one has nothing left to fall through to and still does.
				yield * checkNode(element.value, subpathPrefix, false, isCovered || index < node.elements.length - 1);
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

			// This rule reasons about condition resolution order, so it walks the tree as `JSON.parse` builds it. A shadowed duplicate `default` is not part of the object Node sees, so it must not decide whether `default` comes last.
			for (const problem of checkNode(withoutShadowedMembers(member.value), subpathPrefix)) {
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
