import {
	getRootObject,
	findMember,
	getKey,
	lineIndentOf,
	fieldOrder,
} from './utils/index.js';

const MESSAGE_ID = 'prefer-side-effects-field';
const FALSE_SUGGESTION_ID = 'setFalse';
const TRUE_SUGGESTION_ID = 'setTrue';

const messages = {
	[MESSAGE_ID]: 'Declare a `sideEffects` field to describe import-time side effects.',
	[FALSE_SUGGESTION_ID]: 'Add `"sideEffects": false`.',
	[TRUE_SUGGESTION_ID]: 'Add `"sideEffects": true`.',
};

const sideEffectsOrder = fieldOrder.indexOf('sideEffects');

const addSideEffects = (fixer, sourceCode, root, value) => {
	const entry = `"sideEffects": ${JSON.stringify(value)}`;

	// Anchor on the canonical order of known fields only, and place the entry after the last one that precedes
	// `sideEffects`, which is where a sorted document holds it. Anchoring on the first field that follows instead
	// would insert `sideEffects` ahead of any earlier field that is merely written out of order, such as an
	// `exports` behind an `engines`, and ahead of an unknown field, which `sort-properties` keeps last.
	const knownBefore = root.members.findLast(member => {
		const order = fieldOrder.indexOf(getKey(member));
		return order !== -1 && order < sideEffectsOrder;
	});

	// The new member is a sibling of the one it goes after, so it takes that member's own indentation rather
	// than the one `detect-indent` infers for the file, which is the deepest increase in it rather than the
	// level this line sits at. `prefer-type-module` and `require-private` anchor the same way.
	const separator = root.loc.start.line === root.loc.end.line
		? ' '
		: '\n' + lineIndentOf(sourceCode, knownBefore);

	// `exports` is a precondition of this rule and sorts before `sideEffects`, so there is always a known field to
	// place it after.
	return fixer.insertTextAfter(knownBefore, `,${separator}${entry}`);
};

/** @param {import('eslint').Rule.RuleContext} context */
const create = context => {
	const {sourceCode} = context;

	return {
		Document(node) {
			const root = getRootObject(node);

			if (!root || findMember(root, 'sideEffects') || !findMember(root, 'exports')) {
				return;
			}

			context.report({
				node: root,
				messageId: MESSAGE_ID,
				suggest: [
					{
						messageId: FALSE_SUGGESTION_ID,
						fix: fixer => addSideEffects(fixer, sourceCode, root, false),
					},
					{
						messageId: TRUE_SUGGESTION_ID,
						fix: fixer => addSideEffects(fixer, sourceCode, root, true),
					},
				],
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
			description: 'Recommend declaring the `sideEffects` field for packages.',
			recommended: true,
		},
		hasSuggestions: true,
		schema: [],
		messages,
		languages: ['json/json'],
	},
};

export default config;
