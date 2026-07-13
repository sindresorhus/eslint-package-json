import {
	getRootObject,
	findMember,
	getKey,
	validVersion,
} from './utils/index.js';

const MESSAGE_ID = 'prefer-engines-range';
const SUGGESTION_ID = 'convert';

const messages = {
	[MESSAGE_ID]: 'The `engines.{{engine}}` range should be an open-ended `>=` range, not `{{range}}`.',
	[SUGGESTION_ID]: 'Use `{{replacement}}`.',
};

/**
Compute the `>=` replacement for a caret/tilde/exact engines range, or `undefined` if it should be left alone.
*/
const toOpenRange = range => {
	// Only simple single-comparator ranges convert cleanly. Compound ranges (`^18 || ^20`, `^18 <20`) must be left alone.
	if (range.includes(' ') || range.includes('|')) {
		return undefined;
	}

	if (range.startsWith('^') || range.startsWith('~')) {
		return '>=' + range.slice(1);
	}

	// A bare exact version (e.g. `18.0.0`) implies only that version.
	if (validVersion(range) !== null) {
		return '>=' + range;
	}

	return undefined;
};

/** @param {import('eslint').Rule.RuleContext} context */
const create = context => ({
	Document(node) {
		const root = getRootObject(node);

		if (!root) {
			return;
		}

		const engines = findMember(root, 'engines');

		if (engines?.value.type !== 'Object') {
			return;
		}

		for (const member of engines.value.members) {
			if (member.value.type !== 'String') {
				continue;
			}

			const range = member.value.value;
			const replacement = toOpenRange(range);

			if (replacement === undefined) {
				continue;
			}

			context.report({
				node: member.value,
				messageId: MESSAGE_ID,
				data: {engine: getKey(member), range},
				suggest: [
					{
						messageId: SUGGESTION_ID,
						data: {replacement},
						fix: fixer => fixer.replaceText(member.value, JSON.stringify(replacement)),
					},
				],
			});
		}
	},
});

/** @type {import('eslint').Rule.RuleModule} */
const config = {
	create,
	meta: {
		type: 'suggestion',
		docs: {
			description: 'Prefer open-ended `>=` ranges in the `engines` field.',
			recommended: true,
		},
		hasSuggestions: true,
		schema: [],
		messages,
		languages: ['json/json'],
	},
};

export default config;
