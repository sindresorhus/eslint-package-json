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
	],
	invalid: [
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
		'{"repositories": "user/repo"}',
		'{"repo": "user/repo"}',
		'{"autor": "Sindre"}',
		// No suggestion: the correct field already exists.
		'{"dependencies": {}, "dependancies": {}}',
	],
});
