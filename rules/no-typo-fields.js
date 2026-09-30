import {
	getRootObject,
	getKey,
	findMember,
	knownFields,
	fieldOrder,
} from './utils/index.js';

const MESSAGE_ID = 'no-typo-fields';
const RENAME_SUGGESTION_ID = 'rename';

const messages = {
	[MESSAGE_ID]: 'Unknown field `{{key}}`. Did you mean `{{correct}}`?',
	[RENAME_SUGGESTION_ID]: 'Rename the field to `{{correct}}`.',
};

// Common misspellings that supplement the edit-distance check below (it only catches single-character slips), from npm's own table in `@npmcli/package-json/lib/normalize-data.js`. A misspelling of a field npm ignores is left out: renaming `prefereGlobal` to `preferGlobal` would hand `no-deprecated-fields` the report the author has to act on anyway, and `no-deprecated-fields` already names the field to delete.
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

	// Restrict the edit-distance heuristic to longer names. A single-character slip on a short field (`os`, `bin`, `man`) collides with too many legitimate custom keys (e.g. `min` is one edit from `main`), so only compare names of four or more characters. Explicit short typos belong in the `typos` map above.
	if (key.length < 4) {
		return undefined;
	}

	// A field name is a word. Punctuation only reaches this heuristic by accident, and a trailing `#` is how a manifest marks a field for removal in a later major, so "correcting" it would turn an inert marker into a live field npm then tries to resolve.
	if (!/^[\w-]+$/u.test(key)) {
		return undefined;
	}

	// A single edit can only ever change the length by one, so the length check rejects almost every candidate before the quadratic distance runs. It is exact, not an approximation.
	return longFields.find(field => Math.abs(key.length - field.length) <= 1 && editDistance(key, field) === 1);
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

			// The rename is a suggestion rather than an autofix because it can change what npm reads: renaming `dependancies` to `dependencies` or `script` to `scripts` is the only thing that makes the value live, so a silent `--fix` would add a dependency or a script the author never wrote. It is also only offered when it would not collide with an existing field.
			const suggest = findMember(root, correct)
				? []
				: [{
					messageId: RENAME_SUGGESTION_ID,
					data: {correct},
					fix: fixer => fixer.replaceText(member.name, JSON.stringify(correct)),
				}];

			context.report({
				node: member.name,
				messageId: MESSAGE_ID,
				data: {key, correct},
				suggest,
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
		hasSuggestions: true,
		schema: [],
		messages,
		languages: ['json/json'],
	},
};

export default config;
