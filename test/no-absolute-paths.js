import {getTester} from './utils/test.js';

const {test} = getTester(import.meta);

test.snapshot({
	valid: [
		'{"main": "./dist/index.js"}',
		'{"bin": {"foo": "./cli.js"}}',
		'{"exports": {"import": "./index.mjs"}}',
		'{"files": ["dist/**"]}',
		'{"files": ["!dist/**/*.test.js"]}',
		// Non-path fields are not scanned, even with absolute-looking values.
		'{"config": {"outDir": "/tmp/build"}}',
		// A URL is not an absolute path.
		'{"main": "https://cdn.example.com/index.js"}',
	],
	invalid: [
		'{"main": "/abs/index.js"}',
		'{"bin": {"foo": "/usr/local/bin/foo"}}',
		'{"exports": {"import": "/abs/index.mjs"}}',
		// Windows drive path.
		'{"main": "C:/project/index.js"}',
		// String `bin` form.
		'{"bin": "/usr/local/bin/foo"}',
		// Absolute path inside an `exports` array fallback.
		'{"exports": ["./index.js", "/abs/fallback.js"]}',
		// A `files` pattern is already relative to the package root, so the slash is redundant.
		'{"files": ["/dist"]}',
		'{"files": ["/dist", "/src"]}',
		// The negation stays put.
		'{"files": ["dist", "!/dist/test"]}',
		// Every leading slash goes, and every `!` stays.
		'{"files": ["//dist"]}',
		'{"files": ["!!/dist"]}',
		// Nothing but slashes has no shorter form to suggest, so it is reported as an absolute path instead.
		'{"files": ["/"]}',
		'{"files": ["!/"]}',
		// A leading slash is stripped from a `files` pattern, but a Windows drive is not.
		'{"files": ["C:/project/dist"]}',
		// The `!` prefix is not part of the reported path.
		'{"files": ["!C:/project/dist"]}',
	],
});
