import {getRootObject, findMember, getKey} from './utils/index.js';

const MESSAGE_ID = 'no-exports-trailing-slash';

const messages = {
	[MESSAGE_ID]: 'Trailing-slash folder mapping `{{value}}` in `{{field}}` is deprecated; use a subpath pattern like `{{suggestion}}` instead.',
};

/**
Recursively walk an `exports`/`imports` value tree, yielding every trailing-slash subpath key and string value.
*/
function * findTrailingSlashes(node, subpathPrefix) {
	switch (node.type) {
		case 'Object': {
			for (const member of node.members) {
				const key = getKey(member);

				if (key.startsWith(subpathPrefix) && key.endsWith('/')) {
					yield member.name;
				}

				yield * findTrailingSlashes(member.value, subpathPrefix);
			}

			break;
		}

		case 'Array': {
			for (const element of node.elements) {
				yield * findTrailingSlashes(element.value, subpathPrefix);
			}

			break;
		}

		case 'String': {
			if (node.value.endsWith('/')) {
				yield node;
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

			for (const target of findTrailingSlashes(member.value, subpathPrefix)) {
				const {value} = target;
				const suggestion = value + '*';

				context.report({
					node: target,
					messageId: MESSAGE_ID,
					data: {field, value, suggestion},
					fix: fixer => fixer.replaceText(target, JSON.stringify(suggestion)),
				});
			}
		}
	},
});

/** @type {import('eslint').Rule.RuleModule} */
const config = {
	create,
	meta: {
		type: 'problem',
		docs: {
			description: 'Disallow deprecated trailing-slash folder mappings in `exports`/`imports`.',
			recommended: true,
		},
		fixable: 'code',
		schema: [],
		messages,
		languages: ['json/json'],
	},
};

export default config;
