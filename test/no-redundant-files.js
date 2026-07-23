import {getTester} from './utils/test.js';

const {test} = getTester(import.meta);

test.snapshot({
	valid: [
		// A rooted negation can still be ambiguous beside a universal pattern.
		'{"files": ["**", "!tests"]}',
		// A repeated positive pattern is still useful when an intervening negation can affect it.
		'{"files": ["dist", "!dist", "dist"]}',
		// A root-like pattern is not analysable, so a negation beside it is left alone.
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
		// A negation of the package root (`.`) contains everything, so disjointness can never be proven and no entry is called redundant.
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
		// An even number of leading bangs is an inclusion.
		'{"files": ["!!tests"]}',
		'{"files": ["!!tests", "!tests"]}',
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
		'{"bin": {"commands/cli": "first.js", "cli": "second.js"}, "files": ["second.js"]}',
		'{"bin": {"cli": "first.js", "commands/cli": "second.js"}, "files": ["second.js"]}',
		'{"bin": {"commands:cli": "first.js", "cli": "second.js"}, "files": ["second.js"]}',
		'{"bin": {"commands/__proto__": "cli.js"}, "files": ["cli.js"]}',
		'{"bin": {"": "cli.js"}, "files": ["cli.js"]}',
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
		// An even number of leading bangs produces an inclusion.
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
	],
});
