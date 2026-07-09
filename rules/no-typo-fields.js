import {
	getRootObject,
	getKey,
	findMember,
	knownFields,
	fieldOrder,
} from './utils/index.js';

const MESSAGE_ID = 'no-typo-fields';

const messages = {
	[MESSAGE_ID]: 'Unknown field `{{key}}`. Did you mean `{{correct}}`?',
};

// Common misspellings that supplement the edit-distance check below (it only catches single-character slips), from npm/normalize-package-data's `typos.json`.
const typos = new Map([
	['dependancies', 'dependencies'],
	['dependecies', 'dependencies'],
	['depdenencies', 'dependencies'],
	['depends', 'dependencies'],
	['devEependencies', 'devDependencies'],
	['dev-dependencies', 'devDependencies'],
	['devDependences', 'devDependencies'],
	['devDepenencies', 'devDependencies'],
	['devdependencies', 'devDependencies'],
	['repostitory', 'repository'],
	['repo', 'repository'],
	['repositories', 'repository'],
	['hompage', 'homepage'],
	['hampage', 'homepage'],
	['autohr', 'author'],
	['autor', 'author'],
	['contributers', 'contributors'],
	['publicationConfig', 'publishConfig'],
	['script', 'scripts'],
]);

// Known fields long enough for the single-character-slip heuristic (see `findCorrection`). Precomputed once.
const longFields = fieldOrder.filter(field => field.length >= 4);

/**
The Levenshtein edit distance between two strings.
*/
const editDistance = (a, b) => {
	let previous = Array.from({length: b.length + 1}, (_, index) => index);

	for (let row = 1; row <= a.length; row++) {
		const current = [row];

		for (let column = 1; column <= b.length; column++) {
			const cost = a[row - 1] === b[column - 1] ? 0 : 1;
			current[column] = Math.min(
				previous[column] + 1,
				current[column - 1] + 1,
				previous[column - 1] + cost,
			);
		}

		previous = current;
	}

	return previous[b.length];
};

/**
Find the field this key most likely meant: a known typo, or a single-character slip of a known field.
*/
const findCorrection = key => {
	if (typos.has(key)) {
		return typos.get(key);
	}

	// Restrict the edit-distance heuristic to longer names. A single-character slip on a short
	// field (`os`, `bin`, `man`) collides with too many legitimate custom keys (e.g. `min` is one
	// edit from `main`), so only compare names of four or more characters. Explicit short typos
	// belong in the `typos` map above.
	if (key.length < 4) {
		return undefined;
	}

	return longFields.find(field => editDistance(key, field) === 1);
};

/** @param {import('eslint').Rule.RuleContext} context */
const create = context => ({
	Document(node) {
		const root = getRootObject(node);

		if (!root) {
			return;
		}

		for (const member of root.members) {
			const key = getKey(member);

			if (knownFields.has(key)) {
				continue;
			}

			const correct = findCorrection(key);

			if (!correct) {
				continue;
			}

			// Only offer the rename when it would not collide with an existing field.
			const fix = findMember(root, correct)
				? null
				: fixer => fixer.replaceText(member.name, JSON.stringify(correct));

			context.report({
				node: member.name,
				messageId: MESSAGE_ID,
				data: {key, correct},
				fix,
			});
		}
	},
});

/** @type {import('eslint').Rule.RuleModule} */
const config = {
	create,
	meta: {
		type: 'problem',
		docs: {
			description: 'Disallow misspelled package.json field names.',
			recommended: true,
		},
		fixable: 'code',
		schema: [],
		messages,
		languages: ['json/json'],
	},
};

export default config;
