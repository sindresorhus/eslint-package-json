import {getTester} from './utils/test.js';

const {test} = getTester(import.meta);

test.snapshot({
	valid: [
		'{"dependencies": {}}',
		'{"devDependencies": {}}',
		// Custom/tool fields are not close to a known field.
		'{"xo": {}}',
		'{"ava": {}}',
		// `bun` is a runtime config key, not a typo of `bin`.
		'{"bun": {}}',
		// Short custom keys are not edit-distance matched against short fields (`min`→`main`/`bin`, `is`→`os`).
		'{"min": "index.js"}',
		'{"is": "x"}',
		// Deferred to `no-deprecated-fields`, not flagged as typos.
		'{"licenses": []}',
		'{"modules": "index.js"}',
		// `repositories` is a legacy field `npm publish` still honors: normalization takes its first entry
		// as `repository`. Renaming the key while keeping the array would publish an array as `repository`.
		'{"repositories": "user/repo"}',
		'{"repositories": [{"type": "git", "url": "git+https://github.com/user/repo.git"}]}',
		// `repositories` is not a typo, so nothing is reported even next to a real `repository`.
		'{"repository": "u/r", "repositories": ["u/r"]}',
		// `authors` is the historical plural of `author` and npm passes it through. Renaming it to `author`
		// hands npm an array where `stringifyPerson` expects one person, which normalizes to `{}` and
		// erases everyone credited.
		'{"authors": ["Jane Doe <jane@example.com>", "John Smith <john@example.com>"]}',
		// A trailing `#` is how a manifest marks a field for removal in a later major. "Correcting" it turns
		// an inert marker into a live field npm then tries to resolve, and no field name carries punctuation
		// the heuristic could reach on purpose.
		'{"main#": "to do: next major: remove field"}',
		'{"types#": "to do: next major: remove field"}',
		'{"exports#": "x"}',
		'{"#ame": "x"}',
		'{"nam?": "x"}',
		// `licence` is the spelling npm reads a license from when `license` is absent, so it is a field
		// rather than a misspelling of `license`.
		'{"licence": "MIT"}',
		'{"name": "foo", "licence": "MIT"}',
		// `preferGlobal` is a known field npm ignores, so a misspelling of it is not corrected here: the rename
		// would only hand `no-deprecated-fields` the report the author has to act on anyway, and that rule
		// already names the field to delete.
		'{"prefereGlobal": true}',
	],
	invalid: [
		// A four-character field is the shortest the edit-distance heuristic considers.
		'{"nome": "x"}',
		'{"bugz": "https://example.com"}',
		'{"dependancies": {}}',
		'{"devDependences": {}}',
		'{"dev-dependencies": {}}',
		'{"hompage": "https://example.com"}',
		// Multi-edit typo only the explicit map catches (edit distance > 1).
		'{"hampage": "https://example.com"}',
		// Singular form of a known field.
		'{"script": {}}',
		// Edit-distance-1 typo caught by the heuristic, not the explicit map.
		'{"sideEffect": true}',
		'{"repo": "user/repo"}',
		'{"autor": "Sindre"}',
		// No suggestion: the correct field already exists.
		'{"dependencies": {}, "dependancies": {}}',
	],
});
