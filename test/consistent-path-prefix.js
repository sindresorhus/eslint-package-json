import {getTester} from './utils/test.js';

const {test} = getTester(import.meta);

test.snapshot({
	valid: [
		// Already has ./ prefix (default: always).
		'{"main": "./index.js"}',
		'{"module": "./index.mjs"}',
		'{"types": "./index.d.ts"}',
		'{"typings": "./index.d.ts"}',
		'{"browser": "./dist/browser.js"}',
		'{"bin": "./cli.js"}',
		'{"bin": {"mycli": "./bin/cli.js"}}',
		// Absolute paths are skipped.
		'{"main": "/usr/local/bin/foo"}',
		'{"main": "C:/foo/index.js"}',
		String.raw`{"main": "C:\\foo\\index.js"}`,
		// URLs are skipped.
		'{"browser": "https://cdn.example.com/foo.js"}',
		// Globs are skipped.
		'{"main": "dist/*.js"}',
		// Prefix=never: no ./ is valid.
		{
			code: '{"main": "index.js"}',
			options: [{prefix: 'never'}],
		},
		{
			code: '{"bin": {"mycli": "bin/cli.js"}}',
			options: [{prefix: 'never'}],
		},
		// Missing field is fine.
		'{"name": "foo"}',
		// A bare `./` is left alone in `never` mode (stripping it would yield an empty path).
		{
			code: '{"main": "./"}',
			options: [{prefix: 'never'}],
		},
		// Non-string values are ignored.
		'{"main": 123}',
		'{"bin": {"mycli": 123}}',
	],
	invalid: [
		// Missing ./ (default: always).
		'{"main": "index.js"}',
		'{"module": "index.mjs"}',
		'{"types": "index.d.ts"}',
		'{"typings": "index.d.ts"}',
		'{"browser": "dist/browser.js"}',
		'{"bin": "cli.js"}',
		'{"bin": {"mycli": "bin/cli.js"}}',
		// Prefix=never: has ./ which should be removed.
		{
			code: '{"main": "./index.js"}',
			options: [{prefix: 'never'}],
		},
		{
			code: '{"bin": {"mycli": "./bin/cli.js"}}',
			options: [{prefix: 'never'}],
		},
		// Multiple fields at once.
		'{"main": "index.js", "types": "index.d.ts"}',
		// Paths must not escape the package.
		'{"main": "../sibling/index.js"}',
		'{"main": "./../sibling/index.js"}',
		String.raw`{"main": "..\\sibling\\index.js"}`,
		String.raw`{"main": ".\\dist\\index.js"}`,
		{
			code: '{"main": "../sibling/index.js"}',
			options: [{prefix: 'never'}],
		},
	],
});
