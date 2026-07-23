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
	plugins: {json, 'rule-to-test': {rules: {'no-duplicate-dependencies': rule}}},
	rules: {'rule-to-test/no-duplicate-dependencies': 'error'},
}];
const applyFix = (code, fix) => code.slice(0, fix.range[0]) + fix.text + code.slice(fix.range[1]);

snapshotTest.snapshot({
	valid: [
		'{"dependencies": {"a": "1.0.0"}, "devDependencies": {"b": "1.0.0"}}',
		// Peer + dev overlap is allowed.
		'{"peerDependencies": {"a": "1.0.0"}, "devDependencies": {"a": "1.0.0"}}',
		'{"dependencies": {"a": "1.0.0"}}',
	],
	invalid: [
		'{"dependencies": {"a": "1.0.0"}, "devDependencies": {"a": "1.0.0"}}',
		'{"dependencies": {"a": "1.0.0"}, "optionalDependencies": {"a": "1.0.0"}}',
		'{"dependencies": {"a": "1.0.0", "b": "1.0.0"}, "devDependencies": {"b": "2.0.0"}}',
		// Same package across three groups is reported for each later group.
		'{"dependencies": {"a": "1.0.0"}, "devDependencies": {"a": "1.0.0"}, "optionalDependencies": {"a": "1.0.0"}}',
		// Differing specifiers only get a suggestion: npm resolves the conflict to one of them, so removing either changes the installed version.
		'{"dependencies": {"a": "^7.0.0"}, "devDependencies": {"a": "^6.0.0"}}',
		'{"dependencies": {"a": "^1.0.0"}, "optionalDependencies": {"a": "~1.0.0"}}',
		// A non-string duplicate differs from its string counterpart, so it is a suggestion too.
		'{"dependencies": {"a": "1.0.0"}, "devDependencies": {"a": 1}}',
	],
});

test('autofix removes all duplicate keys in the later dependency group', () => {
	const code = '{"dependencies": {"foo": "^1"}, "devDependencies": {"foo": "^2", "foo": "^1"}}';
	const messages = linter.verify(code, config, {filename: 'package.json'});
	const fix = messages.find(message => message.fix)?.fix;

	assert.ok(fix);
	assert.equal(applyFix(code, fix), '{"dependencies": {"foo": "^1"}, "devDependencies": {}}');
});

test('suggestions remove only the selected differing dependency', () => {
	const code = '{"dependencies": {"foo": "^1"}, "devDependencies": {"foo": "^2", "foo": "^3"}}';
	const messages = linter.verify(code, config, {filename: 'package.json'});
	const outputs = messages
		.flatMap(message => message.suggestions ?? [])
		.map(suggestion => applyFix(code, suggestion.fix));

	assert.deepEqual(outputs, [
		'{"dependencies": {"foo": "^1"}, "devDependencies": {"foo": "^3"}}',
		'{"dependencies": {"foo": "^1"}, "devDependencies": {"foo": "^2"}}',
	]);
});

test('suggestion preserves a later differing dependency', () => {
	const code = '{"dependencies": {"foo": "^1"}, "devDependencies": {"foo": "^1", "foo": "^2"}}';
	const messages = linter.verify(code, config, {filename: 'package.json'});
	const suggestion = messages.flatMap(message => message.suggestions ?? [])[0];

	assert.ok(suggestion);
	assert.equal(applyFix(code, suggestion.fix), '{"dependencies": {"foo": "^1"}, "devDependencies": {"foo": "^2"}}');
});

test('autofix retains same-group duplicates', () => {
	const code = '{"dependencies": {"foo": "^1.0.0", "foo": "^1.0.0"}}';
	const messages = linter.verify(code, config, {filename: 'package.json'});
	const fix = messages.find(message => message.fix)?.fix;

	assert.ok(fix);
	assert.equal(applyFix(code, fix), '{"dependencies": {"foo": "^1.0.0"}}');
});

test('autofix converges for a same-group duplicate run', () => {
	const code = '{"dependencies": {"foo": "b", "foo": "a", "foo": "a"}}';
	const result = linter.verifyAndFix(code, config, {filename: 'package.json'});

	assert.equal(result.output, '{"dependencies": {"foo": "a"}}');
	assert.equal(linter.verify(result.output, config, {filename: 'package.json'}).length, 0);
});

test('autofix converges when the matching duplicate is later in the run', () => {
	const code = '{"dependencies": {"foo": "b", "foo": "a", "foo": "b", "foo": "b"}}';
	const result = linter.verifyAndFix(code, config, {filename: 'package.json'});

	assert.equal(result.output, '{"dependencies": {"foo": "b"}}');
	assert.equal(linter.verify(result.output, config, {filename: 'package.json'}).length, 0);
});

test('suggestion preserves a different same-group dependency', () => {
	const code = '{"dependencies": {"foo": "^1.0.0", "foo": "^2.0.0"}}';
	const messages = linter.verify(code, config, {filename: 'package.json'});
	const suggestion = messages.flatMap(message => message.suggestions ?? [])[0];

	assert.ok(suggestion);
	assert.equal(applyFix(code, suggestion.fix), '{"dependencies": {"foo": "^1.0.0"}}');
});

test('compares effective dependency specifiers', () => {
	const code = '{"dependencies": {"foo": "^2.0.0", "foo": "^1.0.0"}, "devDependencies": {"foo": "^2.0.0"}}';
	const messages = linter.verify(code, config, {filename: 'package.json'});
	const suggestions = messages.flatMap(message => message.suggestions ?? []);

	assert.equal(messages.filter(message => message.fix).length, 0);
	assert.equal(suggestions.length, 2);
	assert.deepEqual(suggestions.map(suggestion => applyFix(code, suggestion.fix)), [
		'{"dependencies": {"foo": "^2.0.0"}, "devDependencies": {"foo": "^2.0.0"}}',
		'{"dependencies": {"foo": "^2.0.0", "foo": "^1.0.0"}, "devDependencies": {}}',
	]);
});

test('compares parsed dependency specifiers', () => {
	const code = String.raw`{"dependencies": {"foo": "^1.0.0"}, "devDependencies": {"foo": "\u005e1.0.0"}}`;
	const messages = linter.verify(code, config, {filename: 'package.json'});
	const fix = messages.find(message => message.fix)?.fix;

	assert.ok(fix);
	assert.equal(applyFix(code, fix), '{"dependencies": {"foo": "^1.0.0"}, "devDependencies": {}}');
});
