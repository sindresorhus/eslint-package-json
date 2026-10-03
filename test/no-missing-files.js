import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
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
		'{"exports": {".": "./index.js", "./rules/*": "./rules/*.js", "./test/*": "./test/*"}, "bin": "index.js", "files": ["*.js"]}',
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

test('resolves a code block against the directory of the file that holds it', t => {
	const linter = new Linter();
	// A processor names a code block after its container, like `readme.md/0_package.json`, and passes the container as `physicalFilename`. The package directory is the container's directory, not `readme.md` itself.
	const messages = linter.verify(
		'{"exports": "./index.js", "files": ["rules"]}',
		{
			files: ['**'],
			language: 'json/json',
			plugins: {
				json,
				'rule-to-test': {rules: {'no-missing-files': rule}},
			},
			rules: {'rule-to-test/no-missing-files': 'error'},
		},
		{filename: 'readme.md/0_package.json', physicalFilename: 'readme.md'},
	);

	t.assert.deepStrictEqual(messages, []);
});

test('does not follow symlinks during globstar traversal when entry types are unknown', t => {
	const packageDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'no-missing-files-'));
	t.after(() => {
		fs.rmSync(packageDirectory, {recursive: true, force: true});
	});

	fs.symlinkSync(packageDirectory, path.join(packageDirectory, 'loop'));

	const originalReadDirectory = fs.readdirSync;
	const originalStat = fs.statSync;
	const followedSymlinks = [];

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
	t.mock.method(fs, 'statSync', entryPath => {
		if (path.basename(entryPath) === 'loop') {
			followedSymlinks.push(entryPath);
		}

		return originalStat(entryPath);
	});

	const linter = new Linter({cwd: packageDirectory});
	const messages = linter.verify(
		'{"files": ["**/missing.js"]}',
		{
			files: ['**'],
			language: 'json/json',
			plugins: {
				json,
				'rule-to-test': {rules: {'no-missing-files': rule}},
			},
			rules: {'rule-to-test/no-missing-files': 'error'},
		},
		{filename: path.join(packageDirectory, 'package.json')},
	);

	t.assert.strictEqual(messages.length, 1);
	t.assert.deepStrictEqual(followedSymlinks, []);
});

snapshotTest.snapshot({
	valid: [
		// A trailing slash asks for a directory, and `rules` is one.
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
		'{"exports": "./node_modules/missing.js"}',
		'{"exports": "./foo/../missing.js"}',
		'{"exports": "././missing.js"}',
		'{"exports": "./%2e%2e/missing.js"}',
		'{"exports": "./%6eode_modules/missing.js"}',
		String.raw`{"exports": ".\\rules\\index.js"}`,
		// The first element may match nothing at run time, so a later one can still apply. `default` decides an element only when its own value does, and a nested conditions object may still match nothing. `default` yields `null`, so Node falls through to the next element and never reaches the sibling condition.
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
		// Npm reads a `\` or a `:` in a `bin` target as a path separator, which this rule does not model, so the target is skipped.
		String.raw`{"name": "package-json", "bin": "rules\\no-missing-files.js"}`,
		'{"name": "package-json", "bin": "rules:no-missing-files.js"}',
		'{"bin": "../missing.js"}',
		'{"bin": "https://example.com/cli.js"}',
		// Node reads a target as a URL, decoding its escapes and dropping a query or a fragment, which this rule does not model, so the target is skipped.
		'{"name": "package-json", "exports": {".": "./index.js?v=1"}}',
		'{"name": "package-json", "exports": {"./frag": "./index.js#top"}}',
		'{"name": "package-json", "imports": {"#q": "./index.js?v=1"}}',
		'{"name": "package-json", "imports": {"#q": "./index.js#top"}}',
		// A `*` written in the target is the one the subpath key substitutes, so it is a pattern and not a file name.
		'{"name": "package-json", "exports": {"./rules/*": "./rules/*.js"}}',
		// A case that reads this repository's own tree, since the rule resolves `files` against the directory the manifest is linted from. The patterns below name paths that ship with the plugin itself, except a glob over `*.md` at the root, which is stable whatever the dev dependencies are.
		'{"files": ["*.md"]}',
		'{"files": ["rules/**/index.js"]}',
		'{"files": ["{rules,docs/rules}/*.md"]}',
		// A brace expansion whose alternatives all name existing directories matches.
		'{"files": ["{rules,docs}"]}',
		// Character classes and extglobs are skipped, whether or not they match.
		'{"files": ["rules/[a-z]*.js"]}',
		'{"files": ["[abc"]}',
		'{"files": ["@(missing)/*.js"]}',
		'{"files": ["missing/*(a|b).js"]}',
		'{"files": ["@(rules"]}',
		'{"files": ["{a,b}{c,d}{e,f}{g,h}{i,j}{k,l}{m,n}{o,p}{q,r}"]}',
		JSON.stringify({files: ['{a}'.repeat(257)]}),
		'{"files": ["rules"]}',
		// Npm 12 strips every trailing slash, so these publish what they name without it. The bare `.//` in the real-directory test is the case that fails without the strip.
		'{"files": ["index.js/", "rules/**/", "rules/*/"]}',
		// Npm 12 strips one leading `./` or `/`, so what is left here is an absolute path.
		'{"files": [".//missing"]}',
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
		'[]',
		'"package"',
		// A condition after `default: null` is unreachable, even when an earlier condition is decisive.
		'{"exports": {".": [{"import": "./index.js", "default": null, "require": "./missing.js"}, "./index.js"]}}',
		// A bare specifier is a file inside a dependency, not in this package, so it names no local path.
		'{"imports": {"#dep": "some-pkg/sub"}}',
		'{"imports": {"#ok": "./index.js"}}',
		// An `imports` key without a leading `#` names a dependency. Node resolves such a specifier against the installed packages and never looks at the target, so no local path is named there.
		'{"imports": {"dep": "./missing.js"}}',
		'{"imports": {"dep": {"node": "./missing.js"}}}',
		'{"imports": {"dep": ["./missing.js", "./index.js"]}}',
		'{"imports": {"#a": ["../outside.js", "./index.js"]}}',
		'{"imports": {"#a": {"node": "../outside.js"}}}',
		String.raw`{"name": "package-json", "bin": "cli\\missing.js"}`,
		'{"name": "package-json", "bin": "cli:missing.js"}',
		'{"name": "package-json", "exports": {"./rules": "./rules/%2Ax.js"}}',
		'{"name": "package-json", "imports": {"#a": "./missing%20file.js"}}',
		// CommonJS consumers are out of scope, so a missing target only a `require` element reaches is not reported when the ES module consumer falls through to one that exists.
		'{"exports": {".": [{"require": "./missing.cjs"}, "./index.js"]}}',
	],
	invalid: [
		// A conditions object inside an array is walked however few of its conditions Node sets, so a target under `browser` alone is still one a consumer has to ask for, and still has to exist.
		'{"exports": {".": [{"browser": "./missing.js"}]}}',
		'{"exports": {".": [{"browser": "./missing.js"}, {"./x": "./y.js"}]}}',
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
		// The same missing pattern twice exercises the match cache and is reported for each entry.
		'{"files": ["missing.js", "missing.js"]}',
		// A multi-wildcard exports pattern substitutes one string for every `*`; no such file exists.
		'{"exports": {"./*": "./rules/*.*.js"}}',
		// A `*` in a `bin` path is a character of the file name, not a pattern.
		'{"name": "package-json", "bin": {"cli": "a*b.js"}}',
		'{"name": "package-json", "bin": "missing-cli.js"}',
		'{"bin": {"first": "./missing-first.js", "second": "missing-second.js"}}',
		'{"bin": "rules"}',
		// A trailing slash on a `bin` target asks for a directory. `index.js` is a file, so `index.js/` names nothing and the linked CLI fails to stat and chmod with ENOTDIR.
		'{"name": "package-json", "bin": "./index.js/"}',
		'{"name": "package-json", "bin": "index.js//"}',
		// A target that names a directory, the bare `./` or anything ending in `/`, is refused by Node with `ERR_UNSUPPORTED_DIR_IMPORT`. That refusal is decisive: an enclosing array does not fall through to a later element, so the first one has to be reported even when the second is fine.
		'{"exports": "./"}',
		'{"exports": ["./", "./index.js"]}',
		'{"exports": "./index.js/"}',
		'{"exports": ["./index.js/", "./index.js"]}',
		'{"exports": {".": ["./index.js/", "./index.js"]}}',
		'{"exports": {".": "./rules/"}}',
		// The object form of `bin` gets the same trailing-slash check as the string form.
		'{"bin": {"cli": "./index.js/"}}',
		// A directory under a subpath key is a target like any other, and Node refuses to import it.
		'{"exports": {".": "./rules"}}',
		// With no `*` in the subpath key there is nothing to substitute, so a `*` in the target stays literal and the target is a plain file name that does not exist.
		'{"exports": {"./feature": "./missing/*.js"}}',
		'{"exports": "./rules/*.js"}',
		'{"exports": {"./feature": "./rules/*.js"}}',
		'{"exports": {"./a": ["./missing/*.js", "./index.js"]}}',
		'{"exports": {"./a": {"default": "./missing/*.js"}}}',
		// A `bin` target has to be a file, so a directory is reported too.
		'{"name": "package-json", "bin": "./rules"}',
		'{"name": "package-json", "bin": "./rules/"}',
		'{"bin": {"cli": "./rules"}}',
		'{"exports": {"./a": "./rules"}}',
		'{"exports": "./missing/"}',
		// An `imports` target is resolved exactly like an `exports` target, so a missing one breaks the `#` specifier at runtime.
		'{"imports": {"#missing": "./missing.js"}}',
		'{"imports": {"#missing": {"node": "./missing.js", "default": "./index.js"}}}',
		'{"imports": {"#missing": ["./missing.js", "./index.js"]}}',
		'{"imports": {"#a": {"default": "./missing.js"}}}',
		'{"exports": "./missing.js/"}',
		'{"imports": {"#a": "./index.js/"}}',
		// `import` is active for every ES module resolution, so an array element keyed on it ends the walk instead of falling through. Verified against Node: each of these breaks the ES module consumer.
		'{"exports": [{"import": "./missing-import.js"}, {"default": "./index.js"}]}',
		'{"exports": {".": [{"default": {"import": "./missing.js"}}, "./index.js"]}}',
		'{"exports": {".": [{"default": [{"import": "./missing.js"}]}, "./index.js"]}}',
		// A `*` the subpath key cannot substitute stays literal, and npm packs no path holding one, so the file may well be on disk and still never ship. Verified with `npm pack`.
		'{"exports": {".": "./starfile/*.js"}}',
		'{"imports": {"#a": "./starfile/*.js"}}',
		// Npm 12 strips one leading `./` or `/` and every trailing slash, so these name nothing or a path that is not there.
		'{"files": ["./"]}',
		'{"files": ["/"]}',
		'{"files": ["/missing"]}',
		'{"files": ["./C:/missing"]}',
		// An unclosed brace group is literal to npm.
		'{"files": ["{rules"]}',
		'{"files": ["{missing,/also-missing}/*"]}',
		// An ES module consumer skips a `require` element and falls through to the next one, so a missing target there breaks `import` even though `require` resolves. Verified against Node.
		'{"exports": [{"require": "./index.js"}, "./missing.js"]}',
		'{"exports": {".": [{"require": "./index.js"}, "./missing.js"]}}',
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

	const fixtureFiles = [
		'index.js',
		'index.d.ts',
		'a',
		'a.js',
		'dist/a.js',
		'dist/b.js',
		'dist/nested/c.js',
		'.hidden.js',
		'Readme.md',
		'lib/Index.js',
		'lib/plain.js',
		// The decoded name of a `bin` target or a `files` pattern, which npm looks up undecoded, so a literal file of the encoded name is a different file npm never matches.
		'uni/c.d.js',
		'dist/a.b.js',
		'dist/x.x.js',
		'sub/deep/y.js',
	];

	for (const relativePath of fixtureFiles) {
		write(relativePath);
	}

	// A real directory with nothing in it, which git cannot track but npm still refuses to pack from.
	fs.mkdirSync(path.join(packageDirectory, 'empty'));

	// A file whose name holds a literal `*`, which is what an `exports` target names when the subpath key has none. Windows does not allow `*` in a file name, so there the target is simply missing, which is reported all the same.
	if (process.platform !== 'win32') {
		write('starfile/*.js');
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
		[
			{exports: {'./star': './starfile/*.js'}},
			1,
			'a `*` the subpath key cannot substitute, which npm packs no path holding even though the file is there',
		],
		[{exports: {'./star': './empty/*.js'}}, 1, 'a subpath key with no `*`, where the literal `*` file name is absent'],
		[{exports: {'./sub/*': './dist/*.*.d.ts'}}, 1, 'an exports pattern repeating `*` with no consistent substitution'],
		[{exports: './.'}, 0, 'an exports target of `./.` resolving to the package directory'],
		// An `imports` specifier substitutes its matched part for the target's `*` exactly like an `exports` subpath does, so a `*` in the specifier is what makes the target's one a pattern.
		[{imports: {'#internal/*': './lib/*'}}, 0, 'an imports specifier whose `*` matches files under `lib`'],
		[{imports: {'#a/*.js': './dist/*.js'}}, 0, 'an imports specifier with a pattern that has matches'],
		[{imports: {'#a/*': './nope/*.js'}}, 1, 'an imports pattern whose directory is absent'],
		[{imports: {'#a/*': './dist/*.z.js'}}, 1, 'an imports pattern with a wildcard matching nothing'],
		// Node decodes a target as a URL, which this rule does not model, so a target holding a `%` is skipped.
		[{exports: {'./a': './uni/h%C3%A9zz.js'}}, 0, 'a percent-encoded exports target, which is skipped'],
		[{exports: {'./a': './%2e%2e/index.js'}}, 0, 'a decoded `..` segment, which is skipped'],
		// Npm decodes neither a `bin` target nor a `files` pattern, so an escape in one is part of the name and the decoded name on disk is a different file.
		[{bin: 'uni/c%2Ed.js'}, 1, 'a `bin` target whose escape npm does not decode'],
		[{files: ['uni/c%2Ed.js']}, 1, 'a `files` pattern whose escape npm does not decode'],
		[{bin: './.'}, 1, 'a bin target of `./.` resolving to a directory, not a file'],
		[{exports: {'.': ['./missing.js', './index.js']}}, 1, 'an array whose first target is missing, which Node does not fall back from'],
		[{exports: {'.': ['./index.js', './missing.js']}}, 0, 'an array whose first target resolves, so later elements are unused'],
		[{exports: {'.': [null, './index.js']}}, 0, 'an array skipping a null element'],
		[{exports: {'.': [null, './missing.js']}}, 1, 'an array skipping a null element to reach a missing target'],
		[{exports: {'.': ['../outside.js', './index.js']}}, 0, 'an array skipping a target outside the package'],
		[{exports: {'.': [{default: './missing.js'}, './index.js']}}, 1, 'an array decided by a `default` condition whose target is missing'],
		[
			{exports: {'.': [{default: {import: './missing.js'}}, './index.js']}},
			1,
			'a leading `default` that does not match the consumer still reaches the `import` inside it',
		],
		[{bin: './index.js'}, 0, 'an existing bin target'],
		[{bin: {tool: './missing.js'}}, 1, 'a missing bin target'],
		[{bin: './link.js'}, 0, 'a bin target behind a symlink to a file'],
		[{bin: './dangling.js'}, 1, 'a bin target behind a dangling symlink'],
		[{bin: './dist'}, 1, 'a bin target pointing at a directory'],
		[{bin: {cli: 'scripts/cli:missing.js'}}, 0, 'a bin target holding a `:`, which npm reads as a separator and this rule skips'],
		[{files: ['index.js']}, 0, 'a literal files entry'],
		[{files: ['missing.js']}, 1, 'a missing literal files entry'],
		[{files: ['missing.js/']}, 1, 'a trailing slash on a missing literal entry'],
		[{files: ['dist']}, 0, 'a files entry naming a directory'],
		[{files: ['dist/*.js']}, 0, 'a files glob with matches'],
		[{files: ['dist/*.ts']}, 1, 'a files glob without matches'],
		[{files: ['link*.js']}, 0, 'a files glob matching a symlink to an existing file'],
		[{files: ['dangling*.js']}, 1, 'a files glob matching only a dangling symlink'],
		[{files: ['link.js/']}, 0, 'a trailing slash on a symlink to an existing file'],
		[{files: ['dangling.js/']}, 1, 'a trailing slash on a dangling symlink, which resolves to nothing either way'],
		[{files: ['**/*.js']}, 0, 'a files globstar'],
		[{files: ['.hidden.js']}, 0, 'a dotfile, which Node\'s glob skips by default'],
		[{files: ['{index,other}.js']}, 0, 'a files brace expansion'],
		[{files: ['dist/{a,nested/c}.js']}, 0, 'a brace expansion whose alternatives span path separators'],
		[{files: ['dist/{a,{b}}.js']}, 0, 'a nested brace expansion'],
		// A `{a..c}` range, a character class and an extglob are glob features this rule does not match, so an entry holding one is skipped rather than reported.
		[{files: ['dist/{x..z}.js']}, 0, 'a brace range expansion with no match'],
		[{files: ['dist/[xy].js']}, 0, 'a character class with no match'],
		[{files: ['index.@(ts|tsx)']}, 0, 'an extglob with no match'],
		[{files: ['lib/!(Index).js']}, 0, 'a negated extglob'],
		[{files: ['{,}x.js']}, 1, 'a brace group with empty alternatives inside a file name'],
		[{files: ['x{,}y.js']}, 1, 'a brace group with an empty alternative in the middle of a name'],
		[{files: ['a/*']}, 1, 'a single-star segment that needs a directory, which the file is not'],
		// An empty alternative expands to an empty path, which matches no file.
		[{files: ['{,x}']}, 1, 'a brace group whose first alternative is empty'],
		[{files: ['{,}']}, 1, 'a brace group whose alternatives are all empty'],
		[{files: ['i*e*.js']}, 0, 'multiple wildcards in one segment that backtrack to a match'],
		[{files: ['index.??']}, 0, 'two single-character wildcards matching an existing extension'],
		[{files: ['!secret']}, 0, 'a negated files entry, which is ignored'],
		[{files: ['../escape']}, 0, 'a files entry escaping the package, which is ignored'],
		[{files: ['readme.md']}, 1, 'a files entry with the wrong case'],
		[{files: ['Readme.md']}, 0, 'a files entry with the right case'],
		[{files: ['lib/index.js']}, 1, 'a nested files entry with the wrong case'],
		[{files: ['dist/{x,{y,a}}.js']}, 0, 'a nested brace group whose only match is inside the inner group'],
		[{files: ['{index}.js']}, 1, 'a single-alternative brace group, which npm keeps literal'],
		[{files: ['']}, 0, 'an empty entry, which `valid-fields` reports'],
		// A skipped URL-syntax target still counts as the one Node stops at, so a later element is never reached.
		[{exports: ['./index.js?v=1', './missing.js']}, 0, 'a skipped URL-syntax target that ends the array'],
		[{imports: {'#a': ['./index.js#x', './missing.js']}}, 0, 'the same in an imports array'],
	];

	// The expectations below were each checked against `npm pack --dry-run` on npm 12, so they pin the rule to npm rather than to itself. `a` is a file here, so any path below it cannot exist.
	const npmCheckedCases = [
		[{files: ['a']}, 0, 'a literal root file'],
		[{files: ['a/']}, 0, 'a literal root file with a trailing slash, which npm 12 strips'],
		[{files: ['index.js/']}, 0, 'a trailing slash on a literal file entry'],
		[{files: ['dist/**/']}, 0, 'a globstar with a trailing slash'],
		[{files: ['dist/*/']}, 0, 'a trailing-slash glob matching a directory'],
		[{files: ['lib/*/']}, 0, 'a trailing slash on a glob whose only matches are files'],
		[{files: ['a/**']}, 0, 'a files globstar whose literal parent is a file, which npm 12 publishes'],
		[{files: ['a.js/**']}, 0, 'a files globstar after a literal file name'],
		[{files: ['./a']}, 0, 'a literal root file with a `./` prefix'],
		[{files: ['/a']}, 0, 'a literal root file with a `/` prefix'],
		[{files: ['/missing']}, 1, 'a missing entry with a `/` prefix'],
		[{files: ['a/b.js']}, 1, 'a literal path below a file'],
		[{files: ['lib/Index.js']}, 0, 'a literal path with the exact case'],
		[{files: ['dist/nested/c.js']}, 0, 'a literal path several segments deep'],
		[{files: ['dist//a.js']}, 0, 'a literal path with a doubled separator'],
		[{files: ['dist/./a.js']}, 0, 'a `.` segment'],
		[{files: ['**/sub']}, 0, 'a globstar-prefixed entry naming a directory'],
		[{files: ['{dist,lib}']}, 0, 'a brace group whose alternatives are directories'],
		[{files: ['dist/**/*.js']}, 0, 'a globstar one level down'],
		[{files: ['*']}, 0, 'a bare star, which matches dotfiles the way npm does'],
		[{files: ['.*']}, 0, 'a dot-prefixed pattern'],
		[{files: ['?.js']}, 0, 'a single-character wildcard extension'],
		[{files: ['dist/a?b.js']}, 0, 'a single-character wildcard inside a name'],
		[{files: ['a?b.js']}, 1, 'a single-character wildcard matching no root file'],
		[{files: ['dist/**/*']}, 0, 'a globstar followed by a star'],
		[{files: ['{dist,lib}/*.js']}, 0, 'a brace group naming two directories'],
		[{files: ['dist/{a,b}.js']}, 0, 'a brace group inside a directory'],
		[{files: ['C:/windows.js']}, 1, 'a Windows drive path, which is a relative path on POSIX'],
		// A pattern naming the package root matches no file, so npm publishes nothing for it.
		[{files: ['.']}, 1, 'a files entry naming the package root'],
		[{files: ['./']}, 1, 'a bare `./`'],
		[{files: ['/']}, 1, 'a bare `/`'],
		[{files: ['.//']}, 1, 'a `./` prefix followed by a slash'],
		[{files: ['././']}, 1, 'the same root named through two prefixes'],
		[{files: ['./.']}, 1, 'a files entry naming the package root through a dot segment'],
		// `glob` reads a run of `**` as one, and the rule collapses it the same way, so the walk does not multiply with each repetition.
		[{files: ['dist/**/**/c.js']}, 0, 'a repeated globstar'],
		[{files: ['**/**/**/**/**/**/**/**/**/**/**/**/missing.js']}, 1, 'a long run of globstars matching nothing'],
	];

	// The entries below are the ones where this rule deliberately parts company with npm, so they are kept out of the checked list above. The first two are another rule's business. The rest are cases where npm 12 publishes no file even though the pattern names something real: it emits no file for a directory with nothing in it, a brace expansion that leaves a trailing slash matches only a directory, and a globstar after a glob-magic segment publishes nothing when that segment matches only files. None is worth a branch here, but each is pinned so a later change cannot widen the divergence silently.
	const knownDivergences = [
		[{files: ['!dist']}, 0, 'a negated entry, which is ignored'],
		[{files: [String.raw`back\slash.js`]}, 0, 'a backslash path, which another rule owns'],
		[{files: ['empty/']}, 0, 'a directory with nothing in it, which npm packs no file from'],
		[{files: ['a/{,b}']}, 0, 'a brace group whose empty alternative leaves a trailing slash after a file'],
		[{files: ['a*/**']}, 0, 'a globstar after a glob-magic segment matching only files'],
	];

	for (const [manifest, count, description] of [...npmCheckedCases, ...knownDivergences]) {
		cases.push([manifest, count, description]);
	}

	const actual = cases.map(([manifest]) => countProblems(manifest));
	const expected = cases.map(([, count]) => count);
	const describe = counts => cases.map(([manifest, , description], index) => `${counts[index]}  ${description}: ${JSON.stringify(manifest)}`);

	t.assert.deepStrictEqual(describe(actual), describe(expected));
});
