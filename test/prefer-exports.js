import {getTester} from './utils/test.js';

const {test} = getTester(import.meta);

test.snapshot({
	valid: [
		'{"name": "foo", "exports": "./index.js"}',
		'{"name": "foo"}',
		// Non-entry fields are untouched.
		'{"name": "foo", "bin": "./cli.js"}',
	],
	invalid: [
		'{"main": "./index.js"}',
		'{"module": "./index.mjs"}',
		'{"browser": "./index.browser.js"}',
		'{"types": "./index.d.ts"}',
		'{"typings": "./index.d.ts"}',
		// These fields are still reported when `exports` is present.
		'{"exports": "./index.js", "main": "./index.js", "types": "./index.d.ts", "browser": {"./server.js": "./browser.js"}}',
		// Multiple legacy fields.
		'{"main": "./index.js", "module": "./index.mjs", "types": "./index.d.ts"}',
	],
});
