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
	plugins: {json, 'rule-to-test': {rules: {'no-core-module-dependencies': rule}}},
	rules: {'rule-to-test/no-core-module-dependencies': 'error'},
}];
const applyFix = (code, fix) => code.slice(0, fix.range[0]) + fix.text + code.slice(fix.range[1]);

snapshotTest.snapshot({
	valid: [
		'{"dependencies": {"lodash": "^4.0.0"}}',
		'{"dependencies": {"my-path-utils": "^1.0.0"}}',
		// Ignored built-in name.
		{
			code: '{"dependencies": {"os": "^0.1.2"}}',
			options: [{ignore: ['os']}],
		},
		// A maintained userland package under a core module's own name, which code imports on purpose with a trailing slash (`require('punycode/')`) or which bundlers install as the browser polyfill.
		'{"dependencies": {"punycode": "^2.3.1"}}',
		'{"dependencies": {"string_decoder": "^1.3.0"}}',
		'{"dependencies": {"buffer": "^6.0.3"}}',
		'{"dependencies": {"events": "^3.3.0"}}',
		'{"dependencies": {"process": "^0.11.10"}}',
		'{"dependencies": {"util": "^0.12.5"}}',
		'{"dependencies": {"assert": "^2.1.0"}}',
		'{"dependencies": {"url": "^0.11.4"}}',
	],
	invalid: [
		'{"dependencies": {"path": "^0.12.7"}}',
		'{"dependencies": {"fs": "0.0.2"}}',
		'{"devDependencies": {"crypto": "^1.0.0"}}',
		'{"dependencies": {"path": "^0.12.7", "os": "^0.1.2"}}',
		// Removing only the effective member would promote the earlier duplicate into its place.
		'{"dependencies": {"path": "^0.12.7", "path": "^0.13.0"}}',
	],
});

test('removing the only entry takes the group with it', () => {
	// An empty group is what `no-empty-fields` reports, so leaving one behind trades this rule's own report
	// for another's, which is no better than not having removed the entry at all.
	const code = '{"name": "foo", "dependencies": {"fs": "^1.0.0"}}';
	const [message] = linter.verify(code, config, {filename: 'package.json'});

	assert.equal(applyFix(code, message.suggestions[0].fix), '{"name": "foo"}');
});

test('a group that keeps another entry keeps itself', () => {
	const code = '{"name": "foo", "dependencies": {"fs": "^1.0.0", "lodash": "^4.0.0"}}';
	const [message] = linter.verify(code, config, {filename: 'package.json'});

	assert.equal(applyFix(code, message.suggestions[0].fix), '{"name": "foo", "dependencies": {"lodash": "^4.0.0"}}');
});
