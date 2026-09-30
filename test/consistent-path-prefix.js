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
		// The object form of `browser` is a replacement map, and a bare value in it is a module request resolved from the package root (webpack's `AliasFieldPlugin`, browserify's `browser-resolve`), not a relative path, so the map is not checked. A `false` value shims the module out instead.
		'{"browser": {"fs": false, "lodash": "./lodash/index.js"}}',
		'{"browser": {"./a.js": "/abs/b.js"}}',
		'{"browser": {"./a.js": "old.js", "./a.js": "./b.js"}}',
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
		// Stripping `./` off a doubled separator would leave a path rooted at the filesystem root, which is a different file from the one the manifest points at.
		{
			code: '{"main": ".//index.js"}',
			options: [{prefix: 'never'}],
		},
		{
			code: '{"bin": {"mycli": ".//bin/cli.js"}}',
			options: [{prefix: 'never'}],
		},
		// An empty path is malformed, and `no-empty-fields` reports it. There is nothing to prefix.
		'{"main": ""}',
		'{"types": ""}',
		'{"bin": ""}',
		'{"bin": {"mycli": ""}}',
		// Stripping `./` off a Windows drive path would leave a drive-relative path, not a relative one.
		'{"main": "./C:/x"}',
		// A `bin` key repeated with a different value resolves to the last one, so the shadowed path is not the one npm installs.
		'{"bin": {"mycli": "bin/cli.js", "mycli": "./bin/cli.js"}}',
		{
			code: '{"bin": {"mycli": "./bin/cli.js", "mycli": "bin/cli.js"}}',
			options: [{prefix: 'never'}],
		},
		'{"files": ["a.js"], "main": "", "types": "./a.d.ts"}',
		'{"browser": {"request": "xhr"}}',
		'{"browser": {"./server.js": "b.js"}}',
		'{"browser": {"lodash": "lodash/index.js"}}',
		'{"browser": {"./a.js": "./b.js", "./a.js": "old.js"}}',
		{
			code: '{"browser": {"./server.js": "./client.js"}}',
			options: [{prefix: 'never'}],
		},
	],
	invalid: [
		// Missing ./ (default: always). Npm force-includes `main` and `browser` as written, so their prefix is offered as a suggestion rather than fixed; `bin` is fixed because npm normalizes its targets first.
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
		{
			code: String.raw`{"main": "./dist\\index.js"}`,
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
		// The mirror of the rule's `always` mode: npm compares `main` and `browser` as written, so removing the prefix changes what it publishes, and the fix is offered as a suggestion either way.
		{
			code: '{"main": "./index.js"}',
			options: [{prefix: 'never'}],
		},
		{
			code: '{"browser": "./lib/browser.js"}',
			options: [{prefix: 'never'}],
		},
		{
			code: '{"module": "./index.mjs"}',
			options: [{prefix: 'never'}],
		},
	],
});
