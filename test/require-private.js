import test from 'node:test';
import assert from 'node:assert/strict';
import {Linter} from 'eslint';
import json from '@eslint/json';
import plugin from '../index.js';
import {getTester} from './utils/test.js';

const {test: snapshotTest, rule} = getTester(import.meta);
const linter = new Linter();
const config = [{
	files: ['**'],
	language: 'json/json',
	plugins: {json, 'rule-to-test': {rules: {'require-private': rule}}},
	rules: {'rule-to-test/require-private': 'error'},
}];
const sortConfig = [{
	files: ['**'],
	language: 'json/json',
	plugins: {json, 'package-json': plugin},
	rules: {'package-json/sort-properties': 'error', 'package-json/sort-dependencies': 'error'},
}];
const applyFix = (code, fix) => code.slice(0, fix.range[0]) + fix.text + code.slice(fix.range[1]);
const applySuggestion = code => {
	const [message] = linter.verify(code, config, {filename: 'package.json'});
	return applyFix(code, message.suggestions[0].fix);
};

snapshotTest.snapshot({
	valid: [
		'{"private": true}',
		'{"name": "foo", "private": true}',
		// The final duplicate key is the effective value.
		'{"private": false, "private": true}',
	],
	invalid: [
		// An empty package.json should get a complete valid object from the suggestion.
		'{}',
		// Missing `private`.
		'{"name": "foo"}',
		// Present but not `true`.
		'{"private": false}',
		'{"private": "true"}',
		'{"private": 1}',
		'{"private": null}',
		'{"private": []}',
		'{"private": {}}',
		// The final duplicate key is the effective value.
		'{"private": true, "private": false}',
		// Preserve the default indentation for an empty multiline object.
		'{\n}',
		// Preserve compact formatting when adding the field next to a nested object.
		'{"dependencies": {\n\t"foo": "1.0.0"\n}}',
		// Preserve multiline formatting when the first member shares the opening line.
		'{"name": "foo",\n\t"version": "1.0.0"}',
		// Preserve multiline formatting when adding the field.
		`{
			"name": "foo",
			"version": "1.0.0"
		}`,
		// With no field ranking before `private`, it goes first.
		'{"description": "x", "license": "MIT"}',
		'{\n  "workspaces": [\n    "packages/*"\n  ],\n  "devDependencies": {\n    "xo": "^1.0.0"\n  }\n}',
	],
});

test('the added member lands where a sorted document holds it', () => {
	// Appending it would leave `sort-properties` reporting the very document the suggestion produced.
	const code = '{\n\t"name": "a",\n\t"version": "1.0.0",\n\t"main": "index.js",\n\t"dependencies": {\n\t\t"a": "^2.0.0"\n\t}\n}';
	const [message] = linter.verify(code, config, {filename: 'package.json'});

	assert.equal(
		applyFix(code, message.suggestions[0].fix),
		'{\n\t"name": "a",\n\t"version": "1.0.0",\n\t"private": true,\n\t"main": "index.js",\n\t"dependencies": {\n\t\t"a": "^2.0.0"\n\t}\n}',
	);

	// With no field ranking before `private`, it goes first rather than last.
	assert.equal(applySuggestion('{"description": "x", "license": "MIT"}'), '{"private": true, "description": "x", "license": "MIT"}');
	assert.equal(
		applySuggestion('{\n\t"workspaces": [\n\t\t"packages/*"\n\t],\n\t"devDependencies": {\n\t\t"xo": "^1.0.0"\n\t}\n}'),
		'{\n\t"private": true,\n\t"workspaces": [\n\t\t"packages/*"\n\t],\n\t"devDependencies": {\n\t\t"xo": "^1.0.0"\n\t}\n}',
	);
});

test('the suggestion keeps a sorted document sorted', () => {
	const inputs = [
		'{}',
		'{\n}',
		'{"name": "a"}',
		'{"description": "x", "license": "MIT"}',
		'{"name": "a", "version": "1.0.0", "description": "x"}',
		'{"custom": true}',
		'{"name": "a", "name": "b", "description": "x"}',
		'{"dependencies": {\n\t"foo": "1.0.0"\n}}',
		'{"name": "foo",\n\t"version": "1.0.0"}',
		'{\n\t"workspaces": [\n\t\t"packages/*"\n\t],\n\t"devDependencies": {\n\t\t"xo": "^1.0.0"\n\t}\n}',
		'{\n  "name": "a",\n  "files": [\n      "dist"\n  ]\n}',
		'{\n    "description": "x",\n    "custom": true\n}',
	];

	const isReported = code => linter.verify(code, sortConfig, {filename: 'package.json'}).length > 0;

	assert.deepEqual(inputs.filter(code => isReported(code)), []);
	// A document that does not parse is reported too, so this also proves every output is valid JSON.
	assert.deepEqual(inputs.map(code => applySuggestion(code)).filter(output => isReported(output)), []);
});
