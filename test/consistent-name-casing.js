import {getTester} from './utils/test.js';

const {test} = getTester(import.meta);

test.snapshot({
	valid: [
		// Kebab-case scripts.
		'{"scripts": {"build": "tsc"}}',
		'{"scripts": {"build-prod": "tsc --build"}}',
		'{"scripts": {"lint:fix": "eslint --fix"}}',
		// Most npm lifecycle names are already lowercase, so they pass the kebab check.
		'{"scripts": {"test": "ava"}}',
		'{"scripts": {"prepare": "npm run build"}}',
		'{"scripts": {"postinstall": "node setup.js"}}',
		'{"scripts": {"pretest": "npm run lint"}}',
		// `prepublishOnly` is npm's only non-kebab lifecycle name and is special-cased.
		'{"scripts": {"prepublishOnly": "npm test"}}',
		// Kebab-case bin.
		'{"bin": {"my-cli": "cli.js"}}',
		'{"bin": {"foo": "foo.js"}}',
		// Bin as a string (not an object) — ignored.
		'{"bin": "cli.js"}',
		// No scripts or bin.
		'{"name": "foo"}',
		// Alphanumeric segments.
		'{"scripts": {"build1": "tsc"}}',
		'{"scripts": {"v8-compile-cache": "node compile.js"}}',
	],
	invalid: [
		// CamelCase scripts.
		'{"scripts": {"buildProd": "tsc"}}',
		// PascalCase scripts.
		'{"scripts": {"BuildProd": "tsc"}}',
		// Snake_case scripts.
		'{"scripts": {"build_prod": "tsc"}}',
		// CamelCase bin.
		'{"bin": {"myCli": "cli.js"}}',
		// PascalCase bin.
		'{"bin": {"MyCli": "cli.js"}}',
		// Multiple violations.
		'{"scripts": {"buildProd": "tsc", "lintFix": "eslint --fix"}}',
		// Mix of valid and invalid.
		'{"scripts": {"build": "tsc", "buildProd": "tsc --build"}}',
		// Colon-separated with bad segment.
		'{"scripts": {"pre:buildProd": "echo pre"}}',
		// A miscased lifecycle name is not exempt; only `prepublishOnly` is special-cased.
		'{"scripts": {"Test": "ava"}}',
	],
});
