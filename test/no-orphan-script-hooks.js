import nodeTest from 'node:test';
import assert from 'node:assert/strict';
import {Linter} from 'eslint';
import json from '@eslint/json';
import {getTester} from './utils/test.js';

const {test, ruleId, rule} = getTester(import.meta);

// Writing a glob where a regular expression is expected is an easy mistake, and `RegExp` throwing raw would surface as an unattributed "Error while loading rule".
const verifyWithIgnore = (ignore, linter = new Linter()) => linter.verify('{"scripts": {"prebuild": "x"}}', {
	files: ['**/package.json'],
	language: 'json/json',
	plugins: {json, 'rule-to-test': {rules: {[ruleId]: rule}}},
	rules: {[`rule-to-test/${ruleId}`]: ['error', {ignore}]},
}, {filename: 'package.json'});

nodeTest('an invalid `ignore` pattern explains itself', () => {
	assert.throws(
		() => verifyWithIgnore(['*build']),
		/takes regular expression sources, not globs, and "\*build" is not a valid one/,
	);

	// A source the non-unicode grammar accepts but the `u` flag the rule adds does not, so the message has to
	// name the flag or it reads as a complaint about a pattern that is valid.
	assert.throws(
		() => verifyWithIgnore([String.raw`\p`]),
		/not a valid one with the `u` flag this rule adds/u,
	);
});

nodeTest('an `ignore` entry that cannot be named in a message is still refused', () => {
	const linter = new Linter();
	const code = '{"scripts": {"prebuild": "x"}}';
	const verify = ignore => linter.verify(code, {
		files: ['**/package.json'],
		language: 'json/json',
		plugins: {json, 'rule-to-test': {rules: {[ruleId]: rule}}},
		rules: {[`rule-to-test/${ruleId}`]: ['error', {ignore}]},
	}, {filename: 'package.json'});

	// A `BigInt` and an object with a cycle are both values `JSON.stringify` refuses, so the message that names
	// the offending entry has to be built without it.
	const circular = {};
	circular.self = circular;

	assert.throws(() => verify([1n]), {message: /is not one/u}, 'a BigInt');
	assert.throws(() => verify([circular]), {message: /is not one/u}, 'a cycle');
});

nodeTest('an `ignore` entry that is not a regular expression source is refused', () => {
	// Every entry becomes a `RegExp` source, so an entry that is not a non-empty string is turned into a
	// pattern the author never wrote. `''` in particular matches every script name, which turns the rule off.
	const rejected = /takes regular expression sources, and .* is not one/u;

	assert.throws(() => verifyWithIgnore([[]]), rejected, 'a nested array');
	assert.throws(() => verifyWithIgnore([42]), rejected, 'a number');
	assert.throws(() => verifyWithIgnore([{}]), rejected, 'an object');
	assert.throws(() => verifyWithIgnore(['']), rejected, 'an empty pattern');

	// V8 defers a source too large to compile until it is first matched, so a long one has to be matched here
	// for the failure to name the option rather than surfacing from inside the visitor, once per linted file.
	assert.throws(() => verifyWithIgnore([`^${'a'.repeat(33_000)}$`]), /takes regular expression sources/u, 'an oversized source');

	assert.deepEqual(verifyWithIgnore(['pre.*']), []);
});

test.snapshot({
	valid: [
		'{}',
		'"package"',
		'{"scripts": 1}',
		'{"scripts": []}',
		'{"scripts": {"build": "tsc", "prebuild": "npm run clean", "postbuild": "npm run check"}}',
		'{"scripts": {"build": "tsc", "postbuild": "npm run check", "prepostbuild": "npm run clean"}}',
		'{"scripts": {"pre": "echo before", "post": "echo after"}}',
		// The npm CLI provides implicit `env` and `restart` scripts.
		'{"scripts": {"preenv": "echo before"}}',
		'{"scripts": {"postenv": "echo after"}}',
		'{"scripts": {"prerestart": "echo before"}}',
		'{"scripts": {"postrestart": "echo after"}}',
		// The npm lifecycle scripts run without a base script.
		`{
	"scripts": {
		"prepare": "echo prepare",
		"prepublish": "echo prepublish",
		"prepublishOnly": "echo prepublish-only",
		"prepack": "echo prepack",
		"postpack": "echo postpack",
		"preinstall": "echo preinstall",
		"postinstall": "echo postinstall",
		"preprepare": "echo preprepare",
		"postprepare": "echo postprepare",
		"postpublish": "echo postpublish",
		"predependencies": "echo predependencies",
		"postdependencies": "echo postdependencies",
		"preversion": "echo preversion",
		"postversion": "echo postversion"
	}
}`,
		'{"scripts": {"preprepare": "echo preprepare", "postprepare": "echo postprepare"}}',
		// A malformed base script is handled by `valid-fields`.
		'{"scripts": {"build": false, "prebuild": "npm run clean"}}',
		// Common standalone tool names are exempt.
		'{"scripts": {"prettier": "prettier --check .", "prettier:fix": "prettier --write ."}}',
		'{"scripts": {"preview": "vite preview", "preview:production": "vite preview --mode production"}}',
		'{"scripts": {"postcss": "postcss src/index.css", "postcss:build": "postcss src/index.css"}}',
		'{"scripts": {"posthtml": "posthtml -o output.html -i input.html", "posthtml:build": "posthtml -o output.html -i input.html"}}',
		// Namespaced `prepare` scripts are standalone commands, not `pre` hooks.
		'{"scripts": {"prepare:safari": "npm run build"}}',
		// Git hook script names are standalone commands, not `pre` hooks.
		'{"scripts": {"precommit": "lint-staged", "pre-commit": "lint-staged", "prepush": "npm test", "pre-push": "npm test"}}',
		// A sub-command of a standalone tool, namespaced with a hyphen as well as a colon, since `npm run
		// prettier-check` looks for `preprettier-check` and never for a `pre` hook on `ttier-check`. Five
		// published packages name a script this way.
		'{"scripts": {"prettier-check": "prettier --check .", "prettier-fix": "prettier --write ."}}',
		'{"scripts": {"postcss-x": "x", "prepare-foo": "y", "preview-1": "z"}}',
		// Standalone names can be exempted explicitly.
		{code: '{"scripts": {"preflight": "npm run check"}}', options: [{ignore: ['^preflight$']}]},
		{code: '{"scripts": {"prebuild": "npm run build", "pretest": "npm test"}}', options: [{ignore: [/^pre/g]}]},
		// An implicit npm `start` script needs an explicit exemption.
		{code: '{"scripts": {"prestart": "npm run setup"}}', options: [{ignore: ['prestart']}]},
		// `ignore` also silences the removed uninstall lifecycle, since it is checked before every report.
		{code: '{"scripts": {"preuninstall": "cleanup"}}', options: [{ignore: ['^preuninstall$']}]},
		// `postinstall-<name>` is a sub-command of the `postinstall` step, not a `post` hook.
		'{"scripts": {"postinstall-link": "npm run link", "postinstall-fail-instructions": "echo failed"}}',
		'{"scripts": {"preinstall-setup": "npm run setup"}}',
		'{"scripts": {"postinstall:link": "npm run link"}}',
		'{"scripts": {"prepare:": "x", "prettier:": "y", "prepare-": "z"}}',
	],
	invalid: [
		// A name that is only the tool name, with no delimiter after it, is still a `pre` hook on the rest of it.
		'{"scripts": {"prettiercheck": "x"}}',

		`{
	"scripts": {
		"prebuild": "npm run clean"
	}
}`,
		'{"scripts": {"posttest": "npm run clean"}}',
		'{"scripts": {"prestart": "npm run setup"}}',
		'{"scripts": {"prebuild": "npm run clean", "posttest": "npm run clean"}}',
		'{"scripts": {"prettierx": "echo no", "previewing": "echo no", "postcssx": "echo no"}}',
		'{"scripts": {"prebuild:watch": "npm run clean"}}',
		// Namespaced Git-like names remain hooks and need a matching target.
		'{"scripts": {"precommit:lint": "lint-staged", "pre-commit:checks": "lint-staged", "prepush:ci": "npm test", "pre-push:checks": "npm test"}}',
		// A standalone command with a hook-like name needs `ignore`.
		'{"scripts": {"preflight": "npm run check"}}',
		// The npm CLI removed the uninstall lifecycle in v7, so these never run and adding `uninstall` would not help.
		'{"scripts": {"preuninstall": "cleanup"}}',
		'{"scripts": {"uninstall": "cleanup"}}',
		'{"scripts": {"postuninstall": "cleanup"}}',
		// Even with the target script present, since npm runs none of the three.
		'{"scripts": {"preuninstall": "cleanup", "uninstall": "cleanup"}}',
		'{"scripts": {"posttest-foo": "x"}}',
		'{"scripts": {"postbuild-foo": "x"}}',
	],
});
