import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {Linter} from 'eslint';
import json from '@eslint/json';
import {getTester} from './utils/test.js';

const {test: snapshotTest, rule} = getTester(import.meta);
const fixturePackageFilename = 'test/fixtures/require-bin-shebang/package.json';

snapshotTest.snapshot({
	valid: [
		'{"name": "foo"}',
		{code: '{"bin": "valid.js"}', filename: fixturePackageFilename},
		{code: '{"bin": "./valid.mjs"}', filename: fixturePackageFilename},
		{code: '{"bin": "eof.js"}', filename: fixturePackageFilename},
		{code: '{"bin": "split-string.js"}', filename: fixturePackageFilename},
		// `env` accepts any run of spaces before `node`, and `-S` accepts its argument glued on.
		{code: '{"bin": "extra-space.js"}', filename: fixturePackageFilename},
		{code: '{"bin": "split-string-extra-space.js"}', filename: fixturePackageFilename},
		{code: '{"bin": "split-string-glued.js"}', filename: fixturePackageFilename},
		// `env` splits its argument on spaces and tabs, so a tab works anywhere a space does.
		{code: '{"bin": "tab.js"}', filename: fixturePackageFilename},
		{code: '{"bin": "space-tab.js"}', filename: fixturePackageFilename},
		{code: '{"bin": "split-string-tab.js"}', filename: fixturePackageFilename},
		{code: '{"bin": "uppercase.JS"}', filename: fixturePackageFilename},
		{code: '{"bin": {"foo": "valid.js", "bar": "valid.cjs"}}', filename: fixturePackageFilename},
		{code: '{"bin": {"foo": "unsupported.txt"}}', filename: fixturePackageFilename},
		{code: '{"bin": {"foo": "missing.js"}}', filename: fixturePackageFilename},
		{code: '{"bin": {"foo": "../../../index.js"}}', filename: fixturePackageFilename},
		{code: '{"bin": "outside.js"}', filename: fixturePackageFilename},
		{code: '{"bin": "directory.js"}', filename: fixturePackageFilename},
		// The Linux kernel buffer holds the shebang and its newline, so 255 bytes is the last length that survives.
		{code: '{"bin": "just-long-enough.js"}', filename: fixturePackageFilename},
		{code: '{"bin": ""}', filename: fixturePackageFilename},
		{code: '{"bin": {"foo": 123}}', filename: fixturePackageFilename},
		// A shadowed target is not installed.
		{code: '{"bin": "invalid.js", "bin": "valid.js"}', filename: fixturePackageFilename},
		{code: '{"bin": {"foo": "invalid.js", "foo": "valid.js"}}', filename: fixturePackageFilename},
		{code: '{"directories": {"bin": "invalid.js"}}', filename: fixturePackageFilename},
		{code: '{"bin": "index.js"}', filename: '<text>'},
		// Linux skips spaces and tabs after `#!` and trims them before the newline.
		{code: '{"bin": "leading-space.js"}', filename: fixturePackageFilename},
		{code: '{"bin": "trailing-space.js"}', filename: fixturePackageFilename},
	],
	invalid: [
		{code: '{"bin": "invalid.js"}', filename: fixturePackageFilename},
		{code: '{"bin": "wrong-shebang.js"}', filename: fixturePackageFilename},
		{code: '{"bin": "wrong-interpreter.js"}', filename: fixturePackageFilename},
		{code: '{"bin": "wrong-interpreter-prefix.js"}', filename: fixturePackageFilename},
		{code: '{"bin": "crlf.js"}', filename: fixturePackageFilename},
		{code: '{"bin": "bom.js"}', filename: fixturePackageFilename},
		{code: '{"bin": "invalid-no-newline.js"}', filename: fixturePackageFilename},
		{code: '{"bin": {"foo": "invalid.js"}}', filename: fixturePackageFilename},
		{code: '{"bin": {"foo": "invalid.js", "bar": "wrong-shebang.js"}}', filename: fixturePackageFilename},
		{code: '{"bin": "inside.js"}', filename: fixturePackageFilename},
		{code: '{"bin": "invalid.cjs"}', filename: fixturePackageFilename},
		{code: '{"bin": "invalid.mjs"}', filename: fixturePackageFilename},
		// Only the final value per `bin` key is installed.
		{code: '{"bin": "valid.js", "bin": "invalid.js"}', filename: fixturePackageFilename},
		{code: '{"bin": {"foo": "valid.js", "foo": "invalid.js"}}', filename: fixturePackageFilename},
		// The Linux kernel hands `env` the whole rest of the line as one argument, so arguments after a bare `node` are part of the program name and `env` exits 127. Only `-S` splits them.
		{code: '{"bin": "arguments.js"}', filename: fixturePackageFilename},
		{code: '{"bin": "tab-terminator.js"}', filename: fixturePackageFilename},
		// One byte past the kernel buffer: the newline lands outside it, so the shebang is cut.
		{code: '{"bin": "too-long.js"}', filename: fixturePackageFilename},
		// The object form names the command, so the report says which one it is about.
		{code: '{"bin": {"tool": "too-long.js"}}', filename: fixturePackageFilename},
		// Without a newline, Linux reads the line out of a zero-padded buffer and trims nothing, so `env` looks for a program named `node `.
		{code: '{"bin": "trailing-space-eof.js"}', filename: fixturePackageFilename},
	],
});

test('resolves a code block against the directory of the file that holds it', () => {
	const linter = new Linter();
	// A processor names a code block after its container, like `readme.md/0_package.json`, and passes the container as `physicalFilename`. The package directory is the container's directory, not `readme.md` itself.
	const messages = linter.verify(
		'{"bin": "invalid.js"}',
		{
			files: ['**'],
			language: 'json/json',
			plugins: {
				json,
				'rule-to-test': {rules: {'require-bin-shebang': rule}},
			},
			rules: {'rule-to-test/require-bin-shebang': 'error'},
		},
		{filename: 'test/fixtures/require-bin-shebang/readme.md/0_package.json', physicalFilename: 'test/fixtures/require-bin-shebang/readme.md'},
	);

	assert.deepEqual(messages.map(({messageId}) => messageId), ['invalidString']);
});

test('the trailing-space fixture keeps its trailing space', () => {
	// `.editorconfig` trims trailing whitespace, which would turn the fixture into a plain shebang that no longer tests anything.
	const content = fs.readFileSync(new URL('fixtures/require-bin-shebang/trailing-space.js', import.meta.url), 'utf8');
	assert.ok(content.startsWith('#!/usr/bin/env node \n'));
});
