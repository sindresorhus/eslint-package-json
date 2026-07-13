import fs from 'node:fs';
import test from 'node:test';
import {Linter} from 'eslint';
import json from '@eslint/json';
import {getTester} from './utils/test.js';

const {test: snapshotTest, rule} = getTester(import.meta);

test('supports directory entries with unknown types', t => {
	const originalReadDirectory = fs.readdirSync;

	t.mock.method(fs, 'readdirSync', (directory, options) => {
		const entries = originalReadDirectory(directory, options);

		if (!options?.withFileTypes) {
			return entries;
		}

		return entries.map(entry => ({
			name: entry.name,
			isDirectory() {
				return false;
			},
			isFile() {
				return false;
			},
			isSymbolicLink() {
				return false;
			},
		}));
	});

	const linter = new Linter();
	const messages = linter.verify(
		'{"exports": {".": "./index.js", "./rules/*": "./rules/*.js", "./test/*": "./test/*"}, "bin": "index.js", "files": ["index.js"]}',
		{
			files: ['**'],
			language: 'json/json',
			plugins: {
				json,
				'rule-to-test': {rules: {'no-missing-files': rule}},
			},
			rules: {'rule-to-test/no-missing-files': 'error'},
		},
		{filename: 'package.json'},
	);

	t.assert.deepStrictEqual(messages, []);
});

snapshotTest.snapshot({
	valid: [
		'{}',
		'{"exports": "./index.js"}',
		'{"exports": {".": "./index.js"}}',
		{
			code: '{"exports": "./index.js"}',
			filename: '<text>',
		},
		'{"exports": {"types": "./index.d.ts", "default": "./index.js"}}',
		'{"exports": {"./rules/*": "./rules/*.js"}}',
		'{"exports": {"./test/*": "./test/*.snapshot"}}',
		'{"exports": {"./feature": "./missing/*.js"}}',
		'{"exports": "./rules/*.js"}',
		'{"exports": "./node_modules/missing.js"}',
		'{"exports": "./foo/../missing.js"}',
		'{"exports": "././missing.js"}',
		'{"exports": "./%2e%2e/missing.js"}',
		'{"exports": "./%6eode_modules/missing.js"}',
		String.raw`{"exports": ".\\rules\\index.js"}`,
		'{"exports": ["./missing.js", "./index.js"]}',
		'{"exports": [{"import": "./missing-import.js"}, {"default": "./index.js"}]}',
		'{"exports": {"import": "./index.js", "require": "./index.js"}}',
		'{"exports": {"./feature": {"import": "./index.js", "default": "./index.js"}}}',
		'{"exports": null}',
		'{"exports": 123}',
		'{"exports": [null]}',
		'{"files": ["index.js", "rules/*.js"]}',
		'{"name": "package-json", "bin": "index.js"}',
		'{"bin": {"package-json": "./index.js", "rule": "rules/no-missing-files.js"}}',
		'{"bin": 123}',
		'{"bin": {"package-json": 123}}',
		'{"bin": "/missing.js"}',
		String.raw`{"bin": "C:\\missing.js"}`,
		String.raw`{"bin": "cli\\missing.js"}`,
		'{"bin": "../missing.js"}',
		'{"bin": "https://example.com/cli.js"}',
		'{"files": ["*rc.js"]}',
		'{"files": ["rules/**/index.js"]}',
		'{"files": ["rules/no-[mr]*.js"]}',
		'{"files": ["{rules,docs/rules}/*.md"]}',
		'{"files": ["@(rules)/*.js"]}',
		'{"files": ["rules/@(no-missing-files|sort-files).js"]}',
		'{"files": ["{a,b}{c,d}{e,f}{g,h}{i,j}{k,l}{m,n}{o,p}{q,r}"]}',
		JSON.stringify({files: ['{a}'.repeat(257)]}),
		'{"files": ["rules"]}',
		'{"files": ["./"]}',
		'{"files": [".//missing", "./C:/missing"]}',
		'{"files": ["{missing,/tmp}/*"]}',
		'{"files": ["{rules", "@(rules"]}',
		'{"files": ["./../missing", "foo/../../missing"]}',
		{
			code: '{"exports": "./no-missing-files.js", "files": ["no-missing-files.js"]}',
			filename: 'rules/package.json',
		},
		'{"files": ["!missing.js"]}',
		'{"files": []}',
		'{"files": "rules"}',
		'{"files": [123, true]}',
		'{"main": "./missing.js", "module": "./missing-module.js", "browser": "./missing-browser.js", "types": "./missing.d.ts", "typings": "./missing-typings.d.ts"}',
		'{"es2015": "./missing-es2015.js", "jsnext:main": "./missing-jsnext.js", "man": ["./missing.1"], "directories": {"lib": "missing"}}',
		'{"imports": {"#missing": "./missing.js"}}',
		'[]',
		'"package"',
	],
	invalid: [
		'{"exports": "./missing.js"}',
		'{"exports": {".": "./missing.js"}}',
		'{"exports": {"./rules/*": "./missing/*.js"}}',
		'{"exports": {"./rules/*": "./rules/*.JS"}}',
		'{"exports": {"./rules/*": "./rules/{no-missing-files,no-redundant-files}.js"}}',
		'{"exports": {"./*": "./{missing,/tmp}/*.js"}}',
		'{"exports": {"./*": "./*/package.json"}}',
		'{"exports": ["./missing.js", "./also-missing.js"]}',
		'{"exports": [{"import": "./missing-import.js"}, {"default": "./also-missing.js"}]}',
		'{"exports": {"import": "./missing.js", "require": "./missing.js"}}',
		'{"exports": {"import": "./missing-import.js", "default": "./index.js"}}',
		'{"exports": {"./feature": "./Index.js"}}',
		'{"exports": {"./rules/*": "./rules"}}',
		'{"files": ["missing"]}',
		'{"files": ["missing/*.js"]}',
		'{"files": ["rules/*.JS"]}',
		'{"files": ["index.js", "missing"]}',
		'{"files": ["missing{,/also-missing}"]}',
		'{"name": "package-json", "bin": "missing-cli.js"}',
		'{"bin": {"first": "./missing-first.js", "second": "missing-second.js"}}',
		'{"bin": "rules"}',
	],
});
