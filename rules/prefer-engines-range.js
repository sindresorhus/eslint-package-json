import {
	getRootObject,
	findMember,
	getKey,
	validRange,
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
	const normalized = validRange(range);

	// A malformed range (`^`, `^abc`) has nothing to convert and would only yield another malformed range; `valid-fields` reports it. A wildcard (`*`, `x`, `~x`) is already open-ended.
	if (normalized === null || normalized === '*') {
		return undefined;
	}

	// Only simple single-comparator ranges convert cleanly. Compound ranges (`^18 || ^20`, `^18 <20`) must be left alone.
	if (range.includes(' ') || range.includes('|')) {
		return undefined;
	}

	const isPrefixed = range.startsWith('^') || range.startsWith('~');
	const version = isPrefixed ? range.slice(1) : range;
	const normalizedVersion = validVersion(version);

	// A bare range only converts when it is an exact version (e.g. `18.0.0`), which implies only that version. Anything else (`>=18`, `18.x`) is already open-ended or not ours to rewrite.
	if (!isPrefixed && normalizedVersion === null) {
		return undefined;
	}

	// Build from the normalized version so a loose input like `v18.0.0` or `18.0.0+build` becomes a clean `>=18.0.0`. A partial version (`18`, `18.x`) does not normalize and is kept as written.
	return '>=' + (normalizedVersion ?? version);
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
