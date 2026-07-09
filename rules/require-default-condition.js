import {getRootObject, findMember, getKey} from './utils/index.js';

const MESSAGE_ID = 'require-default-condition';

const messages = {
	[MESSAGE_ID]: 'A conditions object should include a `default` entry as a fallback.',
};

/**
Whether an object node holds conditions (keys like `import`/`node`) rather than subpaths. An object with any subpath key (starting with `subpathPrefix`) is treated as a subpath map, matching `require-exports-root`; key mixing is reported separately by `valid-fields`.
*/
function isConditionsObject(objectNode, subpathPrefix) {
	return objectNode.members.length > 0 && objectNode.members.every(member => !getKey(member).startsWith(subpathPrefix));
}

/**
Recursively yield conditions objects that lack a `default` entry.
*/
function * checkNode(node, subpathPrefix) {
	switch (node.type) {
		case 'Object': {
			if (
				isConditionsObject(node, subpathPrefix)
				&& node.members.every(member => getKey(member) !== 'default')
			) {
				yield node;
			}

			for (const member of node.members) {
				yield * checkNode(member.value, subpathPrefix);
			}

			break;
		}

		case 'Array': {
			for (const element of node.elements) {
				yield * checkNode(element.value, subpathPrefix);
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

			for (const conditionsObject of checkNode(member.value, subpathPrefix)) {
				context.report({
					node: conditionsObject,
					messageId: MESSAGE_ID,
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
			description: 'Require a `default` entry in `exports`/`imports` conditions objects.',
			recommended: true,
		},
		schema: [],
		messages,
		languages: ['json/json'],
	},
};

export default config;
