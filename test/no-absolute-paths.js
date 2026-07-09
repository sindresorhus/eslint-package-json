import {getTester} from './utils/test.js';

const {test} = getTester(import.meta);

test.snapshot({
	valid: [
		'{"main": "./dist/index.js"}',
		'{"bin": {"foo": "./cli.js"}}',
		'{"exports": {"import": "./index.mjs"}}',
		'{"files": ["dist/**"]}',
		// Non-path fields are not scanned, even with absolute-looking values.
		'{"config": {"outDir": "/tmp/build"}}',
		// A URL is not an absolute path.
		'{"main": "https://cdn.example.com/index.js"}',
	],
	invalid: [
		'{"main": "/abs/index.js"}',
		'{"bin": {"foo": "/usr/local/bin/foo"}}',
		'{"exports": {"import": "/abs/index.mjs"}}',
		'{"files": ["/dist"]}',
		// Windows drive path.
		'{"main": "C:/project/index.js"}',
		// String `bin` form.
		'{"bin": "/usr/local/bin/foo"}',
		// Absolute path inside an `exports` array fallback.
		'{"exports": ["./index.js", "/abs/fallback.js"]}',
	],
});
