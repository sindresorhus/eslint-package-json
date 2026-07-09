import {getTester} from './utils/test.js';

const {test} = getTester(import.meta);

test.snapshot({
	valid: [
		// Normal non-redundant files.
		'{"files": ["src", "dist"]}',
		// Globs are skipped for always-included check.
		'{"files": ["README.*", "*.js"]}',
		// No files field.
		'{"name": "foo"}',
		// Files field with non-array value.
		'{"files": "src"}',
		// Empty array.
		'{"files": []}',
		// Non-string elements are ignored.
		'{"files": ["src", 123, true]}',
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
		// Package.json is always included.
		`{
	"files": [
		"src",
		"package.json"
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
		// With leading ./
		`{
	"files": [
		"./README.md"
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
	],
});
