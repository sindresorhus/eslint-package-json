import {getTester} from './utils/test.js';

const {test} = getTester(import.meta);

test.snapshot({
	valid: [
		// Has a `.` root entry.
		`{
			"exports": {
				".": "./index.js",
				"./sub": "./sub.js"
			}
		}`,
		// Conditions object is itself the root.
		'{"exports": {"import": "./index.js", "default": "./index.cjs"}}',
		// The root reaches the declared primary entry point.
		'{"main": "./index.js", "exports": {".": {"import": "./index.js", "default": "./index.cjs"}}}',
		// String shorthand.
		'{"exports": "./index.js"}',
		// No `exports`.
		'{"name": "foo"}',
	],
	invalid: [
		'{"exports": {"./sub": "./sub.js"}}',
		`{
			"exports": {
				"./sub": "./sub.js",
				"./package.json": "./package.json"
			}
		}`,
		// A null root blocks runtime access.
		'{"exports": {".": null}}',
		// A type-only root is not a usable package entry point.
		'{"exports": {".": {"types": "./index.d.ts"}}}',
		// The root must expose `main` when it is declared.
		'{"main": "./index.js", "exports": {".": "./index.mjs"}}',
	],
});
