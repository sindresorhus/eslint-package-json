import test from 'node:test';
import assert from 'node:assert/strict';
import {Linter} from 'eslint';
import json from '@eslint/json';
import {getTester} from './utils/test.js';

const {test: snapshotTest, rule} = getTester(import.meta);
const linter = new Linter();
const config = [{
	files: ['**'],
	language: 'json/json',
	plugins: {json, 'rule-to-test': {rules: {'no-absolute-paths': rule}}},
	rules: {'rule-to-test/no-absolute-paths': 'error'},
}];

snapshotTest.snapshot({
	valid: [
		'{"main": "./dist/index.js"}',
		'{"bin": {"foo": "./cli.js"}}',
		'{"exports": {"import": "./index.mjs"}}',
		'{"files": ["dist/**"]}',
		'{"man": "npm.1"}',
		'{"man": ["./npm.1", "npm.1"]}',
		'{"man": ["npm.1", 1]}',
		'{"man": {"npm.1": true}}',
		'{"files": ["!dist/**/*.test.js"]}',
		// Non-path fields are not scanned, even with absolute-looking values.
		'{"config": {"outDir": "/tmp/build"}}',
		// A URL is not an absolute path.
		'{"main": "https://cdn.example.com/index.js"}',
		// A key repeated with a different value resolves to the last one, so the shadowed path is not scanned.
		'{"bin": {"foo": "/abs/cli.js", "foo": "./cli.js"}}',
		'{"exports": {".": {"import": "/abs/index.mjs", "import": "./index.mjs"}}}',
		// A `browser` replacement map holds paths as its string values; a `false` shim is not a path.
		'{"browser": {"fs": false, "lodash": "./index.js"}}',
		// An `exports` or `imports` target is `valid-fields`' to report: it names the field, says what the
		// target has to start with, and carries the rewrite, so a path rule stays out of it.
		'{"exports": {".": "/abs/index.js"}}',
		'{"exports": {"import": "/abs/index.mjs"}}',
		'{"exports": ["./index.js", "/abs/fallback.js"]}',
		'{"imports": {"#a": "/abs/index.js"}}',
		// A leading slash on a file npm includes anyway is not a spelling problem: the entry is removable,
		// which is what `no-redundant-files` reports, so rewriting the spelling would only keep it.
		'{"files": ["/LICENSE"]}',
		'{"files": ["/package.json"]}',
		'{"files": ["./Readme.MD"]}',
		'{"files": ["!/LICENSE"]}',
		// A URL is not a path, and a `man` or `browser` value that is not a string has no path to read.
		'{"repository": "https://github.com/u/r", "bugs": {"url": "https://x.com"}}',
		'{"man": {"a": "b"}}',
		// Only `man` takes a list, and a `browser` map is flat, with a string or `false` value per key.
		'{"main": ["/abs/a.js"]}',
		'{"main": {"x": "/abs/a.js"}}',
		'{"browser": {"x": {"y": "/abs/z.js"}}}',
	],
	invalid: [
		'{"main": "/abs/index.js"}',
		'{"bin": {"foo": "/usr/local/bin/foo"}}',
		// Windows drive path.
		'{"main": "C:/project/index.js"}',
		// String `bin` form.
		'{"bin": "/usr/local/bin/foo"}',
		// The field is one path or a list of them. Npm strips the leading `/`, so `/Users/me/npm.1` names `Users/me/npm.1` inside the package, which is not the file the author meant.
		'{"man": "/Users/me/npm.1"}',
		'{"man": ["/Users/me/npm.1"]}',
		'{"man": ["C:/tools/npm.1", "./npm.1"]}',
		// A `files` pattern is already relative to the package root, so the slash is redundant. A file npm
		// includes anyway is not reported here at all, since the entry is removable rather than misspelled.
		'{"files": ["/dist"]}',
		'{"files": ["/CHANGELOG.md"]}',
		'{"files": ["/docs/README.md"]}',
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
		// The object form of `browser` is a replacement map whose string values are paths too.
		'{"browser": {"./server.js": "/Users/me/project/index.js"}}',
		'{"browser": {"fs": false, "lodash": "C:/project/node_modules/lodash/index.js"}}',
	],
});

test('a `browser` replacement map is scanned the way `JSON.parse` builds it', () => {
	// The earlier duplicate is shadowed, so no tool ever reads `/abs/old.js` and it is not a path in the
	// manifest at all. `bin` and `exports` are already read this way.
	const shadowed = '{"browser": {"./a.js": "/abs/old.js", "./a.js": "./b.js"}}';
	assert.deepEqual(linter.verify(shadowed, config, {filename: 'package.json'}), [], shadowed);

	// The effective value is still scanned.
	const effective = '{"browser": {"./a.js": "./b.js", "./a.js": "/abs/new.js"}}';
	assert.equal(linter.verify(effective, config, {filename: 'package.json'}).length, 1, effective);
});
