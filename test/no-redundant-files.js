import {getTester} from './utils/test.js';

const {test} = getTester(import.meta);

test.snapshot({
	valid: [
		// Normal non-redundant files.
		'{"files": ["src", "dist"]}',
		// Globs are skipped for always-included check.
		'{"files": ["README.*", "*.js"]}',
		// A negation after a covering directory is effective.
		'{"files": ["dist", "!dist/tests"]}',
		'{"files": ["rules/valid-fields", "!rules"]}',
		// Literal overlap is compared case-insensitively.
		'{"files": ["dist", "!DIST"]}',
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
		// Any number of leading bangs is a negation.
		'{"files": ["tests", "!!tests", "tests"]}',
		// Repeated patterns can be useful after an opposite pattern changes their effect.
		'{"files": ["dist", "!dist", "dist"]}',
		'{"files": ["dist", "!dist", "dist", "!dist"]}',
		// Always-included globs are still ambiguous because they can match other files.
		'{"files": ["dist", "!+(tests)"]}',
		'{"files": ["**", "!README.*"]}',
		// Empty negated patterns are ignored by npm.
		'{"files": ["!", "!"]}',
		'{"files": ["!!", "!!"]}',
		'{"files": ["!.", "!./", "!/"]}',
		// Root-like patterns are ignored by npm.
		'{"files": [".", "./", "/", ""]}',
		// Bin files are included automatically, but unrelated files are not redundant.
		'{"main": "./index.js", "bin": {"cli": "./cli.js"}, "files": ["dist"]}',
		// Filesystem-dependent main and browser paths are left alone.
		'{"main": "./index.js", "browser": "./browser.js", "files": ["index.js", "browser.js"]}',
		'{"main": "dist", "browser": "browser", "files": ["dist", "browser"]}',
		'{"main": "index.js", "browser": "browser.js", "files": ["index.js", "browser.js"]}',
		// Entry-point paths with different casing are treated conservatively.
		'{"main": "./Index.js", "files": ["index.js"]}',
		// Names with invalid always-included suffixes are not redundant.
		String.raw`{"files": ["README.md/foo", "README.md\\foo", "README.", "README.md~", "README.md$", "README.md/"]}`,
		// No files field.
		'{"name": "foo"}',
		// Files field with non-array value.
		'{"files": "src"}',
		// Empty array.
		'{"files": []}',
		// Non-string elements are ignored.
		'{"files": ["src", 123, true]}',
		// Malformed entry-point fields are ignored.
		'{"main": 123, "bin": ["cli.js"], "browser": {"./browser.js": "./browser.js"}, "files": ["src"]}',
		// Non-local entry-point values are ignored.
		'{"main": "../outside.js", "bin": "/absolute.js", "browser": "https://example.com/browser.js", "files": ["../outside.js", "/absolute.js", "https://example.com/browser.js"]}',
		// Windows absolute entry-point values are also ignored.
		String.raw`{"bin": "\\absolute.js", "files": ["\\absolute.js"]}`,
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
	],
	invalid: [
		// A negation before any positive pattern is ineffective.
		`{
	"files": [
		"!tests"
	]
}`,
		// Disjoint literal patterns cannot make the negation effective.
		`{
	"files": [
		"dist",
		"!tests"
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
		// Any number of leading bangs still produces a negation.
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
		// A leading bang sequence is a negation, not an inclusion.
		`{
	"files": [
		"!!tests"
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
	"bin": "./cli.js",
	"files": [
		"cli.js"
	]
}`,
		// Extensionless bin files are also included.
		`{
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
		`{
	"files": [
		"dist",
		"tests",
		"!tests",
		"dist"
	]
}`,
		// A disjoint intervening inclusion does not make a duplicate negation useful.
		`{
	"files": [
		"tests",
		"!tests",
		"dist",
		"!tests"
	]
}`,
		// Root-like patterns cannot make negations effective.
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
	],
});
