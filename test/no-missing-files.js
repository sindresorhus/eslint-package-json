import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
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
		// A trailing slash yields an empty path segment, which must be skipped rather than treated as missing.
		'{"files": ["rules/"]}',

		'{}',
		'{"exports": "./index.js"}',
		'{"exports": {".": "./index.js"}}',
		// Nothing ever resolves through a shadowed duplicate, so its missing target is not reported.
		'{"exports": {".": {"import": "./missing.js", "import": "./index.js"}}}',
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
		// The first element may match nothing at run time, so a later one can still apply.
		'{"exports": [{"import": "./missing-import.js"}, {"default": "./index.js"}]}',
		// `default` decides an element only when its own value does, and a nested conditions object may still match nothing.
		'{"exports": {".": [{"default": {"import": "./missing.js"}}, "./index.js"]}}',
		'{"exports": {".": [{"default": [{"import": "./missing.js"}]}, "./index.js"]}}',
		// `default` yields `null`, so Node falls through to the next element and never reaches the sibling condition.
		'{"exports": {".": [{"default": null, "import": "./missing.js"}, "./index.js"]}}',
		// A `node` condition after `default: null` is also unreachable.
		'{"exports": {".": [{"default": null, "node": "./missing.js"}, "./index.js"]}}',
		// A target outside the package is a failed resolution, so the next element applies.
		'{"exports": {".": [{"default": "../outside.js"}, "./index.js"]}}',
		'{"exports": {"import": "./index.js", "require": "./index.js"}}',
		'{"exports": {"./feature": {"import": "./index.js", "default": "./index.js"}}}',
		'{"exports": null}',
		'{"exports": 123}',
		'{"exports": [null]}',
		'{"files": ["index.js", "rules/*.js"]}',
		'{"name": "package-json", "bin": "index.js"}',
		'{"bin": {"package-json": "./index.js", "rule": "rules/no-missing-files.js"}}',
		// Only the final value per `bin` key is installed, so a shadowed duplicate's missing target is not reported.
		'{"bin": {"cli": "./missing.js", "cli": "./index.js"}}',
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
		// A character-class range matches a single character; `rules/[a-z]*.js` matches the rule files.
		'{"files": ["rules/[a-z]*.js"]}',
		'{"files": ["{rules,docs/rules}/*.md"]}',
		// A brace expansion whose alternatives all name existing directories matches.
		'{"files": ["{rules,docs}"]}',
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
		// A condition after `default: null` is unreachable, even when an earlier condition is decisive.
		'{"exports": {".": [{"import": "./index.js", "default": null, "require": "./missing.js"}, "./index.js"]}}',
	],
	invalid: [
		// Node stops at the first element that yields a target, so a missing file there is not recovered by a later element.
		'{"exports": ["./missing.js", "./index.js"]}',
		// An object resolves only when every one of its conditions does, so this array has no resolving element.
		'{"exports": {".": [{"import": "./index.js", "require": "./missing.js"}, "./also-missing.js"]}}',
		// `default` matches unconditionally, so this element always yields a target and the one after it is unreachable.
		'{"exports": {".": [{"default": "./missing.js"}, "./index.js"]}}',
		// `node` is always active, so this element always yields a target and the one after it is unreachable.
		'{"exports": {".": [{"node": "./missing.js"}, "./index.js"]}}',
		'{"exports": {".": [{"node": {"import": "./missing.js", "require": "./index.js"}}, "./index.js"]}}',
		'{"exports": {".": [{"node": {"browser": "./index.js"}}, "./missing.js"]}}',
		'{"exports": {".": [{"import": "./missing-import.js"}, {"node": "./missing-node.js"}, "./index.js"]}}',
		'{"exports": [{"module-sync": "./missing-module-sync.js"}, "./index.js"]}',
		'{"exports": {".": [{"node": "./index.js", "default": "./missing.js"}, "./index.js"]}}',
		'{"exports": {".": [{"import": "./missing.js", "default": null}, "./index.js"]}}',
		// Decisiveness is recursive: a nested array holding a decisive element always yields a target too.
		'{"exports": {".": [[{"default": "./missing.js"}], "./index.js"]}}',
		'{"exports": {".": [{"default": ["./missing.js"]}, "./index.js"]}}',
		'{"exports": {".": [{"default": {"default": "./missing.js"}}, "./index.js"]}}',
		// A missing directory entry written with a trailing slash.
		'{"files": ["missing/"]}',
		'{"exports": "./missing.js"}',
		'{"exports": {".": "./missing.js"}}',
		'{"exports": {"./rules/*": "./missing/*.js"}}',
		'{"exports": {"./rules/*": "./rules/*.JS"}}',
		'{"exports": {"./rules/*": "./rules/{no-missing-files,no-redundant-files}.js"}}',
		'{"exports": {"./*": "./{missing,/tmp}/*.js"}}',
		// The wildcard follows this repository's `rules/no-missing-files.js` file, so no environment can provide a matching path.
		'{"exports": {"./*": "./rules/no-missing-files.js/*/package.json"}}',
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
		// An unclosed character class is treated as a literal path segment, which does not exist.
		'{"files": ["[abc"]}',
		// A character-class range that matches no top-level entry.
		'{"files": ["[a-z]"]}',
		// The same missing pattern twice exercises the match cache and is reported for each entry.
		'{"files": ["missing.js", "missing.js"]}',
		// A multi-wildcard exports pattern substitutes one string for every `*`; no such file exists.
		'{"exports": {"./*": "./rules/*.*.js"}}',
		'{"name": "package-json", "bin": "missing-cli.js"}',
		'{"bin": {"first": "./missing-first.js", "second": "missing-second.js"}}',
		'{"bin": "rules"}',
	],
});

/*
The snapshot cases above lint against this repository's own directory, so they only reach the paths its layout happens to exercise. These run against a purpose-built package so the glob and exports matching can be checked against a known tree, including casing, dotfiles, symlinks, and brace expansion.
*/
test('resolves targets against a real package directory', t => {
	const packageDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'no-missing-files-'));
	t.after(() => {
		fs.rmSync(packageDirectory, {recursive: true, force: true});
	});

	const write = relativePath => {
		fs.mkdirSync(path.join(packageDirectory, path.dirname(relativePath)), {recursive: true});
		fs.writeFileSync(path.join(packageDirectory, relativePath), '');
	};

	for (const relativePath of ['index.js', 'index.d.ts', 'dist/a.js', 'dist/b.js', 'dist/nested/c.js', '.hidden.js', 'Readme.md', 'lib/Index.js', 'dist/a[b.js', 'dist/a.b.js', 'dist/x.x.js']) {
		write(relativePath);
	}

	fs.symlinkSync(path.join(packageDirectory, 'index.js'), path.join(packageDirectory, 'link.js'));
	fs.symlinkSync(path.join(packageDirectory, 'nope.js'), path.join(packageDirectory, 'dangling.js'));

	const linter = new Linter({cwd: packageDirectory});
	const config = {
		files: ['**'],
		language: 'json/json',
		plugins: {json, 'rule-to-test': {rules: {'no-missing-files': rule}}},
		rules: {'rule-to-test/no-missing-files': 'error'},
	};

	const countProblems = manifest => linter.verify(
		JSON.stringify(manifest, undefined, '\t'),
		config,
		{filename: path.join(packageDirectory, 'package.json')},
	).length;

	const cases = [
		[{exports: './index.js'}, 0, 'an existing exports target'],
		[{exports: './missing.js'}, 1, 'a missing exports target'],
		[{exports: './INDEX.js'}, 1, 'an exports target with the wrong case'],
		[{exports: {'./*': './dist/*.js'}}, 0, 'an exports pattern with matches'],
		[{exports: {'./*': './nope/*.js'}}, 1, 'an exports pattern whose directory is absent'],
		[{exports: {'./*': './dist/*.b.js'}}, 0, 'an exports pattern with two wildcards matching a double-extension file'],
		[{exports: {'./*': './dist/*.z.js'}}, 1, 'an exports pattern with a wildcard matching nothing'],
		[{exports: {'./*': './dist/*.*.js'}}, 0, 'an exports pattern repeating `*`, which substitutes one value into both (matching `x.x.js`)'],
		[{exports: {'./sub/*': './dist/*.*.d.ts'}}, 1, 'an exports pattern repeating `*` with no consistent substitution'],
		[{exports: './.'}, 0, 'an exports target of `./.` resolving to the package directory'],
		[{bin: './.'}, 1, 'a bin target of `./.` resolving to a directory, not a file'],
		[{exports: {'.': ['./missing.js', './index.js']}}, 1, 'an array whose first target is missing, which Node does not fall back from'],
		[{exports: {'.': ['./index.js', './missing.js']}}, 0, 'an array whose first target resolves, so later elements are unused'],
		[{exports: {'.': [null, './index.js']}}, 0, 'an array skipping a null element'],
		[{exports: {'.': [null, './missing.js']}}, 1, 'an array skipping a null element to reach a missing target'],
		[{exports: {'.': ['../outside.js', './index.js']}}, 0, 'an array skipping a target outside the package'],
		[{exports: {'.': [{default: './missing.js'}, './index.js']}}, 1, 'an array decided by a `default` condition whose target is missing'],
		[{exports: {'.': [{default: {import: './missing.js'}}, './index.js']}}, 0, 'an array whose leading `default` may still yield nothing, so a later element applies'],
		[{bin: './index.js'}, 0, 'an existing bin target'],
		[{bin: {tool: './missing.js'}}, 1, 'a missing bin target'],
		[{bin: './link.js'}, 0, 'a bin target behind a symlink to a file'],
		[{bin: './dangling.js'}, 1, 'a bin target behind a dangling symlink'],
		[{bin: './dist'}, 1, 'a bin target pointing at a directory'],
		[{files: ['index.js']}, 0, 'a literal files entry'],
		[{files: ['missing.js']}, 1, 'a missing literal files entry'],
		[{files: ['dist']}, 0, 'a files entry naming a directory'],
		[{files: ['dist/*.js']}, 0, 'a files glob with matches'],
		[{files: ['dist/*.ts']}, 1, 'a files glob without matches'],
		[{files: ['**/*.js']}, 0, 'a files globstar'],
		[{files: ['.hidden.js']}, 0, 'a dotfile, which Node\'s glob skips by default'],
		[{files: ['{index,other}.js']}, 0, 'a files brace expansion'],
		[{files: ['dist/{a,nested/c}.js']}, 0, 'a brace expansion whose alternatives span path separators'],
		[{files: ['dist/{a,{b}}.js']}, 0, 'a nested brace expansion'],
		[{files: ['dist/[ab].js']}, 0, 'a character class matching an existing file'],
		[{files: ['dist/[a-b].js']}, 0, 'a character-class range matching an existing file'],
		[{files: ['dist/[!z].js']}, 0, 'a negated character class matching an existing file'],
		[{files: ['dist/[xy].js']}, 1, 'a character class matching nothing'],
		[{files: ['dist/[', 'index.js']}, 1, 'an unclosed character class treated as a literal path, which does not exist'],
		[{files: ['index.@(js|ts)']}, 0, 'an extglob alternative matching an existing file'],
		[{files: ['index.@(ts|tsx)']}, 1, 'an extglob none of whose alternatives match'],
		[{files: ['i*e*.js']}, 0, 'multiple wildcards in one segment that backtrack to a match'],
		[{files: ['index.??']}, 0, 'two single-character wildcards matching an existing extension'],
		// A filename literally containing `[`: the glob candidate exists, but the exact-case matcher must treat the unclosed class as a literal `[` to confirm it.
		[{files: ['dist/a[b.js']}, 0, 'an unclosed character class matching a real file whose name contains a bracket'],
		[{files: ['dist/a[c.js']}, 1, 'an unclosed character class whose literal has no matching file'],
		[{files: ['!secret']}, 0, 'a negated files entry, which is ignored'],
		[{files: ['../escape']}, 0, 'a files entry escaping the package, which is ignored'],
		[{files: ['readme.md']}, 1, 'a files entry with the wrong case'],
		[{files: ['Readme.md']}, 0, 'a files entry with the right case'],
		[{files: ['lib/index.js']}, 1, 'a nested files entry with the wrong case'],
	];

	const actual = cases.map(([manifest]) => countProblems(manifest));
	const expected = cases.map(([, count]) => count);
	const describe = counts => cases.map(([manifest, , description], index) => `${counts[index]}  ${description}: ${JSON.stringify(manifest)}`);

	t.assert.deepStrictEqual(describe(actual), describe(expected));
});
