import {
	getRootObject,
	getKey,
	buildReorderedObject,
	isSameOrder,
	optionsSchema,
	stringArraySchema,
	fieldOrder,
} from './utils/index.js';

const MESSAGE_ID = 'sort-properties';

const messages = {
	[MESSAGE_ID]: 'Top-level fields should be in the canonical order.',
};

/**
Compute the desired member order: known keys in canonical order, then unknown keys in original order. `orderIndex` maps each known field to its canonical position.
*/
const getDesiredOrder = (members, orderIndex) => {
	const known = members
		.filter(member => orderIndex.has(getKey(member)))
		.toSorted((a, b) => orderIndex.get(getKey(a)) - orderIndex.get(getKey(b)));
	const unknown = members.filter(member => !orderIndex.has(getKey(member)));

	return [...known, ...unknown];
};

/** @param {import('eslint').Rule.RuleContext} context */
const create = context => {
	const {order = fieldOrder} = context.options[0] ?? {};
	const orderIndex = new Map(order.map((field, index) => [field, index]));
	const {sourceCode} = context;

	return {
		Document(node) {
			const root = getRootObject(node);

			if (!root) {
				return;
			}

			const {members} = root;

			if (members.length === 0) {
				return;
			}

			const desired = getDesiredOrder(members, orderIndex);

			if (isSameOrder(members, desired)) {
				return;
			}

			context.report({
				node: root,
				messageId: MESSAGE_ID,
				fix: fixer => fixer.replaceText(
					root,
					buildReorderedObject(sourceCode, root, desired),
				),
			});
		},
	};
};

/** @type {import('eslint').Rule.RuleModule} */
const config = {
	create,
	meta: {
		type: 'suggestion',
		docs: {
			description: 'Enforce a canonical order for top-level package.json fields.',
			recommended: true,
		},
		fixable: 'code',
		schema: optionsSchema({order: stringArraySchema}),
		messages,
		languages: ['json/json'],
	},
};

export default config;
