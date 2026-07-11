import assert from 'node:assert/strict';
import nodeTest from 'node:test';
import {Linter} from 'eslint';
import json from '@eslint/json';
import sortFiles from '../rules/sort-files.js';
import {getTester} from './utils/test.js';

const {test} = getTester(import.meta);

test.snapshot({
	valid: [
		// No files field.
		'{"name": "foo"}',
		// Invalid files fields are handled by valid-fields.
		'{"files": "dist"}',
		'{"files": ["dist", 1]}',
		'{"files": ["z", ""]}',
		'{"files": ["z", 1, "a"]}',
		'{"files": ["z", "", "a"]}',
		// Empty and singleton arrays need no ordering.
		'{"files": []}',
		'{"files": ["dist"]}',
		// Runtime files precede declaration companions, followed by a directory.
		'{"files": ["index.js", "index.d.ts", "rules"]}',
		// Extensionless runtime paths precede declaration companions too.
		'{"files": ["bin/cli", "bin/cli.d.ts"]}',
		// Exact entry-point targets take precedence over declaration pairing.
		'{"types": "./index.d.ts", "files": ["index.d.ts", "index.js"]}',
		// Versioned TypeScript conditions follow their runtime target.
		'{"exports": {"types@>=5.2": "./ts5.d.ts", "types": "./index.d.ts", "default": "./index.js"}, "files": ["index.js", "ts5.d.ts", "index.d.ts"]}',
		// Every supported declaration extension is paired with its runtime file.
		'{"files": ["index.mjs", "index.d.mts"]}',
		'{"files": ["index.cjs", "index.d.cts"]}',
		// Exact entry-point targets take priority over other entries.
		'{"exports": {"types": "./index.d.ts", "default": "./index.js"}, "bin": "./cli.js", "files": ["index.js", "index.d.ts", "cli.js", "assets"]}',
		// Bare directories and positive glob patterns use the same path ordering.
		'{"files": ["dist", "dist/*.js", "dist/*.d.ts", "src/**/*.js", "src/**/*.d.ts"]}',
		// Repeated exports targets retain their first appearance in the exports tree.
		`{
	"exports": {
		".": {
			"node": {
				"types": "./node.d.ts",
				"import": "./node.js"
			},
			"default": {
				"types": "./default.d.ts",
				"import": "./default.js"
			}
		},
		"./node": "./node.js"
	},
	"files": ["node.js", "node.d.ts", "default.js", "default.d.ts"]
}`,
		// Negations are intentionally ignored because their order has npm semantics.
		'{"files": ["dist", "!dist/**/*.test.js", "dist/index.js"]}',
	],
	invalid: [
		// Entry-point targets sort before unrelated paths and declarations follow runtime files.
		'{"exports": {"types": "./index.d.ts", "default": "./index.js"}, "bin": "./cli.js", "files": ["assets", "cli.js", "index.d.ts", "index.js"]}',
		// Exports take priority over top-level entry-point fields and bin.
		'{"exports": "./exports.js", "main": "./main.js", "bin": "./cli.js", "files": ["cli.js", "main.js", "exports.js"]}',
		// Top-level entry-point fields and a bin object are supported too.
		'{"main": "./index.js", "types": "./index.d.ts", "bin": {"cli": "./cli.js"}, "files": ["assets", "cli.js", "index.d.ts", "index.js"]}',
		// Runtime and declaration globs are paired.
		'{"files": ["src/**/*.d.ts", "src/**/*.js"]}',
		// A single-line package keeps the closing bracket at the root indentation.
		'{"files":["index.d.ts","index.js"]}',
		// Stem groups produce a deterministic canonical order.
		'{"files": ["foo.js", "foo.e.js", "foo.d.ts"]}',
		// Direct string exports take priority over unrelated paths.
		'{"exports": "./index.js", "files": ["other.js", "index.js"]}',
		// Exports fallback arrays preserve their target order.
		'{"exports": ["./index.js", "./fallback.js"], "files": ["other.js", "fallback.js", "index.js"]}',
		// Exact entry-point targets take precedence over declaration pairing.
		'{"types": "./index.d.ts", "files": ["index.js", "index.d.ts"]}',
		// Extensionless runtime paths and declarations are paired too.
		'{"files": ["bin/cli.d.ts", "bin/cli"]}',
		// Normalize the optional ./ prefix when matching an entry point.
		'{"main": "./index.js", "files": ["other.js", "./index.js"]}',
		// Top-level entry-point fields and bin values take priority in their canonical order.
		`{
	"main": "./index.js",
	"module": "./module.js",
	"browser": "./browser.js",
	"types": "./index.d.ts",
	"typings": "./legacy.d.ts",
	"bin": {
		"first": "./cli.js",
		"second": "./other-cli.js"
	},
	"files": ["z.js", "other-cli.js", "legacy.d.ts", "cli.js", "index.d.ts", "browser.js", "module.js", "index.js"]
}`,
		// Directories and globs are sorted together.
		'{"files": ["src/**/*.d.ts", "z", "dist/*.js", "dist", "src/**/*.js", "dist/*.d.ts"]}',
		// An exported glob takes priority over ordinary paths.
		'{"exports": {"./feature/*": "./dist/feature/*.js"}, "files": ["src", "dist/feature/*.js"]}',
		// The first export target wins when a subpath repeats it.
		`{
	"exports": {
		".": {
			"node": {
				"types": "./node.d.ts",
				"import": "./node.js"
			},
			"default": {
				"types": "./default.d.ts",
				"import": "./default.js"
			}
		},
		"./node": "./node.js"
	},
	"files": ["default.js", "default.d.ts", "node.js", "node.d.ts"]
}`,
		// Multiline input preserves tab indentation.
		`{
	"files": [
		"index.d.ts",
		"index.js",
		"rules"
	]
}`,
		// Multiline input preserves 2-space indentation.
		`{
  "files": [
    "src/**/*.d.ts",
    "src/**/*.js"
  ]
}`,
		// Inline arrays use the standard indentation when expanded by the fix.
		`{
  "files": [ "index.d.ts", "index.js" ]
}`,
		// Existing closing indentation is preserved.
		`{
  "files": [
    "index.d.ts",
    "index.js"
 ]
}`,
		// CRLF line endings are preserved.
		'{\r\n\t"files": [\r\n\t\t"index.d.ts",\r\n\t\t"index.js"\r\n\t]\r\n}',
	],
});

nodeTest('preserves CRLF line endings in an autofix', () => {
	const linter = new Linter();
	const result = linter.verifyAndFix('{\r\n\t"files": [\r\n\t\t"index.d.ts",\r\n\t\t"index.js"\r\n\t]\r\n}', {
		files: ['**'],
		language: 'json/json',
		plugins: {
			json,
			'rule-to-test': {
				rules: {
					'sort-files': sortFiles,
				},
			},
		},
		rules: {
			'rule-to-test/sort-files': 'error',
		},
	}, {filename: 'package.json'});

	assert.equal(result.fixed, true);
	assert.match(result.output, /\r\n/u);
	assert.doesNotMatch(result.output, /(^|[^\r])\n/u);
});
