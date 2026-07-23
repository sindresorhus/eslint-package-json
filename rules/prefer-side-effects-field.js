import {
	getRootObject,
	findMember,
	getKey,
	getIndentString,
	getNewline,
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
	const separator = root.loc.start.line === root.loc.end.line
		? ' '
		: getNewline(sourceCode) + getIndentString(sourceCode);

	// Anchor on the canonical order of known fields only. Treating an unknown field as an anchor would insert `sideEffects` ahead of it, and `sort-properties` keeps every unknown field after the known ones, so an unknown field appearing before `exports` would otherwise pull `sideEffects` in front of `exports`.
	const knownAfter = root.members.find(member => fieldOrder.indexOf(getKey(member)) > sideEffectsOrder);

	if (knownAfter) {
		return fixer.insertTextBefore(knownAfter, `${entry},${separator}`);
	}

	// `exports` is a precondition of this rule and sorts before `sideEffects`, so there is always a known field to place it after.
	const knownBefore = root.members.findLast(member => {
		const order = fieldOrder.indexOf(getKey(member));
		return order !== -1 && order < sideEffectsOrder;
	});

	return fixer.insertTextAfter(knownBefore ?? root.members.at(-1), `,${separator}${entry}`);
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
