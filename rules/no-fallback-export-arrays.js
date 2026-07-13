import {getRootObject, findMember} from './utils/index.js';

const MESSAGE_ID = 'no-fallback-export-arrays';

const messages = {
	[MESSAGE_ID]: 'String-target arrays in `{{field}}` are not fallback lists in Node.js; a missing first file or package does not make Node.js try the next target.',
};

/**
Whether an array contains multiple direct string targets that should be checked by this rule.
*/
function isStringTargetArray(node, field) {
	// Node.js allows non-relative export targets in arrays for forward compatibility.
	return node.elements.length >= 2
		&& node.elements.every(element => element.value.type === 'String')
		&& (field !== 'exports' || node.elements.every(element => element.value.value.startsWith('./')));
}

/**
Recursively find arrays with at least two direct string targets.
*/
function * findStringTargetArrays(node, field) {
	switch (node.type) {
		case 'Object': {
			for (const member of node.members) {
				yield * findStringTargetArrays(member.value, field);
			}

			break;
		}

		case 'Array': {
			if (isStringTargetArray(node, field)) {
				yield node;
				break;
			}

			for (const element of node.elements) {
				yield * findStringTargetArrays(element.value, field);
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

		for (const field of ['exports', 'imports']) {
			const member = findMember(root, field);

			if (!member) {
				continue;
			}

			// `imports` must be an object. Leave invalid top-level values to `valid-fields`.
			if (field === 'imports' && member.value.type !== 'Object') {
				continue;
			}

			for (const array of findStringTargetArrays(member.value, field)) {
				context.report({
					node: array,
					messageId: MESSAGE_ID,
					data: {field},
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
			description: 'Discourage string-target fallback arrays in `exports`/`imports`.',
			recommended: true,
		},
		schema: [],
		messages,
		languages: ['json/json'],
	},
};

export default config;
