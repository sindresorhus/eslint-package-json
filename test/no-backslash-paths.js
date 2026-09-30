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
	plugins: {json, 'rule-to-test': {rules: {'no-backslash-paths': rule}}},
	rules: {'rule-to-test/no-backslash-paths': 'error'},
}];

snapshotTest.snapshot({
	valid: [
		'{"main": "./dist/index.js"}',
		'{"bin": {"foo": "./cli.js"}}',
		'{"exports": {"import": "./index.mjs"}}',
		'{"files": ["dist/**"]}',
		'{"man": "npm.1"}',
		'{"man": ["npm.1", 1]}',
		// Non-path fields are not scanned, even with backslashes.
		String.raw`{"config": {"outDir": "build\\out"}}`,
		// A key repeated with a different value resolves to the last one, so the shadowed path is not scanned.
		String.raw`{"bin": {"foo": ".\\cli.js", "foo": "./cli.js"}}`,
		String.raw`{"exports": {".": {"import": ".\\index.mjs", "import": "./index.mjs"}}}`,
		// A `browser` replacement map holds paths as its string values; a `false` shim is not a path.
		'{"browser": {"fs": false, "lodash": "./index.js"}}',
		// Only `man` takes a list, and a `browser` map is flat, with a string or `false` value per key.
		String.raw`{"main": ["a\\b.js"]}`,
		String.raw`{"browser": {"x": {"y": "a\\b.js"}}}`,
	],
	invalid: [
		String.raw`{"main": ".\\dist\\index.js"}`,
		String.raw`{"bin": {"foo": ".\\cli.js"}}`,
		String.raw`{"exports": {"import": ".\\index.mjs"}}`,
		String.raw`{"files": [".\\dist"]}`,
		String.raw`{"types": ".\\index.d.ts"}`,
		// Npm publishes a backslashed `man` entry with forward slashes, so it names the intended file, but the manifest still spells a Windows-only path.
		String.raw`{"man": "npm\\npm.1"}`,
		String.raw`{"man": ["npm\\npm.1", "npm.1"]}`,
		// The object form of `browser` is a replacement map whose string values are paths too.
		String.raw`{"browser": {"./server.js": ".\\dist\\browser.js"}}`,
		// Npm 12 reads a `\` in a `files` entry as a glob escape, so a rewrite would change what ships, and it is offered as a suggestion while `main` in the same manifest is still fixed.
		String.raw`{
	"main": "dist\\index.js",
	"files": [
		"dist\\sub"
	]
}`,
	],
});

test('a `browser` replacement map is scanned the way `JSON.parse` builds it', () => {
	// The earlier duplicate is shadowed, so rewriting the value `JSON.parse` throws away would edit a path no tool ever reads and leave the effective one untouched.
	const shadowed = String.raw`{"browser": {"./a.js": "old\\b.js", "./a.js": "./b.js"}}`;
	assert.deepEqual(linter.verify(shadowed, config, {filename: 'package.json'}), [], shadowed);

	const effective = String.raw`{"browser": {"./a.js": "./b.js", "./a.js": "old\\b.js"}}`;
	assert.equal(linter.verify(effective, config, {filename: 'package.json'}).length, 1, effective);
});
