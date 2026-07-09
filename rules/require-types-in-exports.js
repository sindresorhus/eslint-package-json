import {getRootObject, findMember, getKey} from './utils/index.js';

const MESSAGE_ID = 'require-types-in-exports';

const messages = {
	[MESSAGE_ID]: '`{{field}}` is not exposed through `exports`, so it will not be found by TypeScript `node16`/`nodenext` resolution. Add a `types` condition inside `exports`.',
};

/**
Whether a `types` condition key appears anywhere in an `exports` value tree.
*/
function hasTypesCondition(node) {
	switch (node.type) {
		case 'Object': {
			return node.members.some(member => getKey(member) === 'types' || hasTypesCondition(member.value));
		}

		case 'Array': {
			return node.elements.some(element => hasTypesCondition(element.value));
		}

		default: {
			return false;
		}
	}
}

/** @param {import('eslint').Rule.RuleContext} context */
const create = context => ({
	Document(node) {
		const root = getRootObject(node);

		if (!root) {
			return;
		}

		const exportsMember = findMember(root, 'exports');

		if (!exportsMember) {
			return;
		}

		// Pick the first String-valued declaration; `types` may be present but malformed while `typings` is the real one.
		const typesMember = [findMember(root, 'types'), findMember(root, 'typings')]
			.find(member => member?.value.type === 'String');

		if (!typesMember) {
			return;
		}

		if (hasTypesCondition(exportsMember.value)) {
			return;
		}

		context.report({
			node: typesMember.name,
			messageId: MESSAGE_ID,
			data: {field: getKey(typesMember)},
		});
	},
});

/** @type {import('eslint').Rule.RuleModule} */
const config = {
	create,
	meta: {
		type: 'suggestion',
		docs: {
			description: 'Enforce that types are exposed through the `exports` field.',
			recommended: true,
		},
		schema: [],
		messages,
		languages: ['json/json'],
	},
};

export default config;
