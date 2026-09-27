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
	plugins: {json, 'rule-to-test': {rules: {'no-redundant-files': rule}}},
	rules: {'rule-to-test/no-redundant-files': 'error'},
}];
const applyFix = (code, fix) => code.slice(0, fix.range[0]) + fix.text + code.slice(fix.range[1]);

snapshotTest.snapshot({
	valid: [
		// Npm lists `package.json` without the suffix the other three carry, so `package.json.bak` is an
		// ordinary file a `files` entry does publish. Verified with `npm pack`.
		'{"name": "p", "version": "1.0.0", "files": ["package.json.bak"]}',
		'{"name": "p", "version": "1.0.0", "files": ["/package.json.bak"]}',
		// Two entries that are neither of them redundant leave the array alone.
		'{"name": "p", "version": "1.0.0", "files": ["dist", "lib"]}',
		// A rooted negation can still be ambiguous beside a universal pattern.
		'{"files": ["**", "!tests"]}',
		// A repeated positive pattern is still useful when an intervening negation can affect it.
		'{"files": ["dist", "!dist", "dist"]}',
		// Npm 12 skips a pattern that normalizes to the package root, so it publishes nothing. The rule does not model that and leaves a negation beside it alone.
		`{
	"files": [
		".",
		"!tests"
	]
}`,
		`{
	"files": [
		"./",
		"!tests"
	]
}`,
		`{
	"files": [
		"/",
		"!tests"
	]
}`,
		`{
	"files": [
		"",
		"!tests"
	]
}`,
		// Normal non-redundant files.
		'{"files": ["src", "dist"]}',
		// Globs are skipped for always-included check.
		'{"files": ["README.*", "*.js"]}',
		// A negation of the package root (`.`) is not analysable, so disjointness is never assumed and no entry is called redundant.
		'{"files": ["!.", "src", "!."]}',
		// A negation after a covering directory is effective.
		'{"files": ["dist", "!dist/tests"]}',
		'{"files": ["rules/valid-fields", "!rules"]}',
		// Literal overlap is compared case-insensitively.
		'{"files": ["dist", "!DIST"]}',
		// Non-ASCII literal overlap is ignored conservatively.
		'{"files": ["Ä", "!ä"]}',
		// One covering positive pattern is enough even if another is disjoint.
		'{"files": ["src", "tests", "!tests"]}',
		// Universal patterns cover negations.
		'{"files": ["*", "!tests"]}',
		'{"files": ["**", "!tests"]}',
		// Ambiguous overlap is ignored.
		'{"files": ["src/*.js", "!tests"]}',
		'{"files": ["src/*.js", "!src/test.js"]}',
		'{"files": ["dist", "!tests/*.js", "dist"]}',
		'{"files": ["dist/./tests", "!dist/tests"]}',
		String.raw`{"files": ["dist\\tests", "!dist/tests"]}`,
		'{"files": ["dist", "!tests/**"]}',
		'{"files": ["dist/sub", "!dist//"]}',
		'{"files": ["dist/sub", "!/dist"]}',
		'{"files": ["dist/../tests", "!tests"]}',
		// Npm 12 reads any number of leading bangs as a negation, so the `!!!dist` between the two `dist`
		// entries stops the second from repeating the first.
		'{"files": ["dist", "!!!dist", "dist"]}',
		// Repeated patterns can be useful after an opposite pattern changes their effect.
		'{"files": ["dist", "!dist", "dist"]}',
		'{"files": ["dist", "!dist", "dist", "!dist"]}',
		// Always-included globs are still ambiguous because they can match other files.
		'{"files": ["dist", "!+(tests)"]}',
		'{"files": ["**", "!README.*"]}',
		// Empty bang patterns are ignored by npm.
		'{"files": ["!", "!"]}',
		'{"files": ["!!", "!!"]}',
		'{"files": ["!.", "!./", "!/"]}',
		// Root-like patterns are ignored by npm.
		'{"files": [".", "./", "/", ""]}',
		// Bin files are included automatically, but unrelated files are not redundant.
		'{"main": "./index.js", "bin": {"cli": "./cli.js"}, "files": ["dist"]}',
		// String bin values require a usable package name.
		'{"bin": "./cli.js", "files": ["cli.js", "!cli.js"]}',
		'{"name": "/", "bin": "./cli.js", "files": ["cli.js"]}',
		// Bin command names requiring normalization are ignored conservatively.
		// A non-string `bin` target contributes no always-included path, so a listed file is not judged redundant.
		'{"bin": {"cli": 123}, "files": ["cli.js"]}',
		'{"name": "@scope/__proto__", "bin": "cli.js", "files": ["cli.js"]}',
		// Filesystem-dependent main and browser paths are left alone.
		'{"main": "./index.js", "browser": "./browser.js", "files": ["index.js", "browser.js"]}',
		'{"main": "dist", "browser": "browser", "files": ["dist", "browser"]}',
		'{"main": "index.js", "browser": "browser.js", "files": ["index.js", "browser.js"]}',
		// Names with invalid always-included suffixes are not redundant.
		String.raw`{"files": ["README.md/foo", "README.md\\foo", "README.", "README.md~", "README.md$", "README.md/"]}`,
		// Unicode case folding is ignored conservatively.
		'{"files": ["PACKAGE.JSON"]}',
		'{"bin": {"cli": "İ.js"}, "files": ["i̇.js"]}',
		// No files field.
		'{"name": "foo"}',
		// Files field with non-array value.
		'{"files": "src"}',
		// Empty array.
		'{"files": []}',
		// Non-string elements are ignored.
		'{"files": ["src", 123, true]}',
		// Bin arrays are ignored conservatively.
		'{"bin": ["cli.js"], "files": ["cli.js"]}',
		// Bin values and files entries that normalize differently are not redundant.
		'{"bin": {"outside": "../outside.js", "remote": "https://example.com/remote.js"}, "files": ["../outside.js", "https://example.com/remote.js"]}',
		// Colons in bin paths are normalized to path separators by npm.
		'{"bin": {"cli": "scripts/cli:legacy.js"}, "files": ["scripts/cli:legacy.js"]}',
		// Duplicate bin keys use the final value.
		`{
	"bin": {
		"cli": "./old.js",
		"cli": "./new.js"
	},
	"files": [
		"old.js"
	]
}`,
		// Reasonable set.
		`{
	"files": [
		"src",
		"dist",
		"index.js"
	]
}`,
		// A `bin` key that normalizes to nothing, or to `__proto__`, is dropped by npm, so its target is
		// published only because `files` lists it and the entry is not redundant. Verified with `npm pack`.
		'{"bin": {"": "cli.js"}, "files": ["cli.js"]}',
		'{"bin": {"./": "cli.js"}, "files": ["cli.js"]}',
		'{"bin": {".": "cli.js"}, "files": ["cli.js"]}',
		'{"bin": {"..": "cli.js"}, "files": ["cli.js"]}',
		'{"bin": {"a/..": "cli.js"}, "files": ["cli.js"]}',
		'{"bin": {"commands/__proto__": "cli.js"}, "files": ["cli.js"]}',
		'{"bin": {"a/__proto__": "cli.js"}, "files": ["cli.js"]}',
		// A `bin` key that normalizes onto another one writes its target there before npm reads the other, so
		// the first key wins and the second target is published only because `files` lists it.
		'{"bin": {"commands/cli": "first.js", "cli": "second.js"}, "files": ["second.js"]}',
		'{"bin": {"commands:cli": "first.js", "cli": "second.js"}, "files": ["second.js"]}',
		// Npm renames a `bin` key holding a path separator, a drive, or a colon, so the rule reads no `bin` target at all rather than model the renaming.
		'{"bin": {"cli": "first.js", "commands/cli": "second.js"}, "files": ["second.js"]}',
		'{"name": "p", "bin": {"../x": "lib/cli.js"}, "files": ["lib/cli.js"]}',
		'{"bin": {"a:b": "cli.js"}, "files": ["cli.js"]}',
		'{"bin": {"a/.": "cli.js"}, "files": ["cli.js"]}',
		// Npm 12 reads `!!dist` as a negation, so the third entry does not repeat the first.
		'{"files": ["dist", "!!dist", "dist"]}',
		// Npm 12 hands the raw entry to `glob`, where `\` escapes the next character, so `dist\sub` names `distsub` and the negation does drop `distsub/x.js`.
		String.raw`{"files": ["dist\\sub", "!distsub/x.js"]}`,
	],
	invalid: [
		// A negation carrying a slash is anchored to the package root, so it is comparable and provably disjoint here.
		`{
	"files": [
		"dist",
		"!lib/tests"
	]
}`,
		// A leading slash anchors the negation to the package root, so it can no longer reach `dist/tests`.
		`{
	"files": [
		"dist",
		"!/tests"
	]
}`,
		// A leading `./` anchors it the same way, because npm rewrites it to a leading slash.
		`{
	"files": [
		"dist",
		"!./tests"
	]
}`,
		// A negation before any positive pattern is ineffective, slash or not.
		`{
	"files": [
		"!tests"
	]
}`,
		`{
	"files": [
		"!lib/tests"
	]
}`,
		// A later positive pattern cannot make an earlier negation effective.
		`{
	"files": [
		"!tests",
		"tests"
	]
}`,
		// A negation cannot exclude npm's always-included files.
		`{
	"files": [
		"**",
		"!package.json"
	]
}`,
		// Multiple leading bangs still produce an ineffective negation.
		`{
	"files": [
		"!!!tests"
	]
}`,
		// Any number of leading bangs is a negation, and `README.md` is included whatever `files` says, so
		// the negation cannot exclude it.
		`{
	"files": [
		"!!README.md"
	]
}`,
		// A repeated negation with no intervening inclusion is redundant.
		`{
	"files": [
		"dist",
		"!dist",
		"!dist"
	]
}`,
		// Package.json is always included.
		`{
	"files": [
		"src",
		"package.json"
	]
}`,
		// Package.json matching is case-insensitive.
		`{
	"files": [
		"Package.json"
	]
}`,
		// README.md is always included.
		`{
	"files": [
		"src",
		"README.md"
	]
}`,
		// README without extension.
		`{
	"files": [
		"README"
	]
}`,
		// LICENSE is always included.
		`{
	"files": [
		"src",
		"LICENSE"
	]
}`,
		// LICENCE (British spelling) is always included.
		`{
	"files": [
		"src",
		"LICENCE.md"
	]
}`,
		// COPYING is always included.
		`{
	"files": [
		"COPYING.md"
	]
}`,
		// Bin files are always included.
		`{
	"bin": {
		"cli": "./cli.js"
	},
	"files": [
		"cli.js"
	]
}`,
		// String bin values are always included.
		`{
	"name": "package",
	"bin": "./cli.js",
	"files": [
		"cli.js"
	]
}`,
		// Extensionless bin files are also included.
		`{
	"name": "package",
	"bin": "cli",
	"files": [
		"cli"
	]
}`,
		// Bin entry points cannot be excluded.
		`{
	"bin": {
		"cli": "./cli.js"
	},
	"files": [
		"**",
		"!cli.js"
	]
}`,
		// String bin files cannot be excluded.
		`{
	"name": "package",
	"bin": "./index.js",
	"files": [
		"**",
		"!index.js"
	]
}`,
		// With leading ./
		`{
	"files": [
		"./README.md"
	]
}`,
		// Redundant dot segments are normalized for always-included files.
		`{
	"files": [
		"././README.md"
	]
}`,
		// Redundant dot segments are normalized in files patterns.
		`{
	"name": "package",
	"bin": "index.js",
	"files": [
		"././index.js"
	]
}`,
		// Duplicate entry.
		`{
	"files": [
		"src",
		"dist",
		"src"
	]
}`,
		// Duplicate with glob (still caught as exact duplicate).
		`{
	"files": [
		"src/*.js",
		"src/*.js"
	]
}`,
		// Multiple redundant entries.
		`{
	"files": [
		"src",
		"README.md",
		"LICENSE"
	]
}`,
		// A disjoint intervening negation does not make a duplicate inclusion useful.
		// Colons in bin paths are normalized to path separators by npm.
		`{
	"bin": {
		"cli": "scripts/cli:legacy.js"
	},
	"files": [
		"scripts/cli/legacy.js"
	]
}`,
		// Bin path matching is case-insensitive like npm's packlist.
		`{
	"bin": {
		"cli": "CLI.js"
	},
	"files": [
		"cli.js"
	]
}`,
		// A colon-leading segment is normalized too.
		`{
	"bin": {
		"cli": "cli:legacy.js"
	},
	"files": [
		"cli/legacy.js"
	]
}`,
		// Leading backslashes in bin paths are normalized away.
		String.raw`{
	"bin": {
		"cli": "\\absolute.js"
	},
	"files": [
		"absolute.js"
	]
}`,
		// A slashless negation is rooted by npm, so it cannot exclude `dist/tests`.
		'{"files": ["dist", "!tests"]}',
		// A repeated positive pattern is redundant because the rooted negation cannot affect `dist`.
		'{"files": ["dist", "tests", "!tests", "dist"]}',
		// A repeated rooted negation is redundant when nothing changes its effect.
		'{"files": ["tests", "!tests", "dist", "!tests"]}',
		// Trailing slashes are stripped by npm before expanding negations, so this is rooted too.
		'{"files": ["dist", "!tests/"]}',
		// A repeated `!!` negation with no inclusion between them is redundant.
		'{"files": ["dist", "!!dist", "!!dist"]}',
		// `JSON.parse` makes a `__proto__` key an own data property, so npm keeps that one and publishes its
		// target. A key that renames *onto* `__proto__` is the case npm drops. Verified with `npm pack`.
		'{"bin": {"__proto__": "cli.js"}, "files": ["cli.js"]}',
		// Removing the last entry leaves `"files": []` standing, since an absent `files` is npm's "publish everything", the opposite of an empty one.
		'{"name": "foo", "bin": {"a": "a.js"}, "files": ["a.js", "README.md"]}',
		'{"name": "foo", "files": ["/README.md"]}',
		'{"name": "foo", "files": ["a.js", "a.js"]}',
		// Npm 12 reads any number of leading bangs as a negation, so these negate nothing. Verified with `npm pack`.
		'{"files": ["!!dist"]}',
		'{"files": ["!!dist", "dist"]}',
		'{"files": ["!!tests", "!tests"]}',
	],
});

// An absent `files` field is npm's "publish everything", which is the opposite of the empty array, so
// removing the field is never the right way to take an entry out of an allowlist.
test('a fix never removes the `files` field itself', () => {
	const cases = [
		'{"name": "p", "version": "1.0.0", "files": ["README.md"]}',
		'{"name": "p", "version": "1.0.0", "files": ["README.md", "README.md"]}',
		'{"name": "p", "version": "1.0.0", "files": ["dist", "README.md"]}',
		'{"name": "p", "version": "1.0.0", "files": ["dist", "!README.md"]}',
		'{"name": "p", "version": "1.0.0", "files": ["dist", "dist"]}',
	];

	const outputs = cases.map(code => linter.verify(code, config, {filename: 'package.json'}).map(message => applyFix(code, message.fix)));

	assert.ok(outputs.flat().length >= cases.length, 'every case above should have produced a fix');
	assert.deepEqual(
		outputs.flat().filter(output => !output.includes('"files"')),
		[],
		'a fix removed the `files` field, which turns an allowlist into the publish-everything default',
	);
});

test('a `files` array is never narrowed to nothing', () => {
	// The single-entry case is the one that inverts, since a lone `files` array and an absent field publish
	// different sets.
	const code = '{"name": "p", "version": "1.0.0", "files": ["README.md"]}';
	const [message] = linter.verify(code, config, {filename: 'package.json'});

	assert.equal(applyFix(code, message.fix), '{"name": "p", "version": "1.0.0", "files": []}');
});
