import {getTester} from './utils/test.js';

const {test} = getTester(import.meta);

test.snapshot({
	valid: [
		// No `exports` field.
		'{"types": "./index.d.ts"}',
		// No top-level `types`/`typings`.
		'{"exports": "./index.js"}',
		// Types exposed through a `types` condition.
		`{
			"types": "./index.d.ts",
			"exports": {
				"types": "./index.d.ts",
				"default": "./index.js"
			}
		}`,
		// Types exposed through a nested `types` condition under a subpath.
		`{
			"typings": "./index.d.ts",
			"exports": {
				".": {
					"types": "./index.d.ts",
					"import": "./index.js"
				}
			}
		}`,
		// Non-string `types` is ignored.
		'{"types": 1, "exports": "./index.js"}',
		// Types exposed through a condition inside an array fallback.
		`{
			"types": "./index.d.ts",
			"exports": {
				".": [
					{"types": "./index.d.ts", "default": "./index.js"}
				]
			}
		}`,
	],
	invalid: [
		// `exports` present, top-level `types`, no `types` condition.
		`{
			"types": "./index.d.ts",
			"exports": {
				"import": "./index.js",
				"require": "./index.cjs"
			}
		}`,
		// Same with `typings`.
		`{
			"typings": "./index.d.ts",
			"exports": "./index.js"
		}`,
		// Subpath map without any `types` condition.
		`{
			"types": "./index.d.ts",
			"exports": {
				".": "./index.js"
			}
		}`,
		// Malformed `types` falls back to the valid `typings` declaration.
		`{
			"types": 1,
			"typings": "./index.d.ts",
			"exports": {
				"import": "./index.js"
			}
		}`,
	],
});
