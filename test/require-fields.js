import test from 'node:test';
import assert from 'node:assert/strict';
import {Linter} from 'eslint';
import json from '@eslint/json';
import {getTester} from './utils/test.js';

const {test: snapshotTest, rule} = getTester(import.meta);
const linter = new Linter();

snapshotTest.snapshot({
	valid: [
		// Default fields present.
		'{"name": "foo", "version": "1.0.0", "license": "MIT", "keywords": ["x"], "description": "bar"}',
		// Extra fields are fine.
		'{"name": "foo", "version": "1.0.0", "license": "MIT", "keywords": ["x"], "description": "bar", "type": "module"}',
		// Custom `fields` present.
		{
			code: '{"name": "foo", "description": "bar"}',
			options: [{fields: ['name', 'description'], fieldsWhenPublic: []}],
		},
		// Empty `fields` list — nothing unconditionally required.
		{
			code: '{"name": "foo", "license": "MIT", "keywords": ["x"], "description": "bar"}',
			options: [{fields: [], fieldsWhenPublic: []}],
		},
		// Single required field present.
		{
			code: '{"name": "foo", "license": "MIT", "keywords": ["x"], "description": "bar"}',
			options: [{fields: ['name'], fieldsWhenPublic: []}],
		},
		// Private packages are exempt from `fieldsWhenPublic`.
		'{"name": "foo", "version": "1.0.0", "private": true}',
		// Private packages do not need `name` or `version`.
		'{"private": true}',
		// Custom `fieldsWhenPublic`.
		{
			code: '{"author": "Sindre"}',
			options: [{fieldsWhenPublic: ['author']}],
		},
	],
	invalid: [
		// Missing `version` (default `fieldsWhenPublic`).
		'{"name": "foo", "license": "MIT", "keywords": ["x"], "description": "bar"}',
		// Missing `name` (default `fieldsWhenPublic`).
		'{"version": "1.0.0", "license": "MIT", "keywords": ["x"], "description": "bar"}',
		// Missing default `fieldsWhenPublic` entries.
		'{"description": "no name or version"}',
		// Custom `fields` entry missing.
		{
			code: '{"name": "foo"}',
			options: [{fields: ['name', 'license'], fieldsWhenPublic: []}],
		},
		// Custom `fields` are still required for private packages.
		{
			code: '{"private": true}',
			options: [{fields: ['name'], fieldsWhenPublic: []}],
		},
		// Overlapping `fields` and `fieldsWhenPublic` entries are only reported once.
		{
			code: '{"name": "foo", "version": "1.0.0", "keywords": ["x"], "description": "bar"}',
			options: [{fields: ['name', 'version', 'license']}],
		},
		// Completely empty object.
		'{}',
		// Missing default `fieldsWhenPublic` entries.
		'{"name": "foo", "version": "1.0.0"}',
		// Missing only `description`.
		'{"name": "foo", "version": "1.0.0", "license": "MIT", "keywords": ["x"]}',
		// `"private": false` is not exempt.
		'{"name": "foo", "version": "1.0.0", "private": false}',
		// Custom `fieldsWhenPublic` entry missing.
		{
			code: '{"name": "foo", "version": "1.0.0"}',
			options: [{fieldsWhenPublic: ['description', 'license']}],
		},
	],
});

test('a name no manifest can spell is refused by the schema', () => {
	// The rule has no fix, so a name that can never be a key is an error nothing can resolve. Saying so in the
	// configuration beats a rule that is permanently red on every file it lints.
	const verify = options => linter.verify('{"name": "foo"}', {
		files: ['**'],
		language: 'json/json',
		plugins: {json, 'rule-to-test': {rules: {'require-fields': rule}}},
		rules: {'rule-to-test/require-fields': ['error', options]},
	}, {filename: 'package.json'});

	const problems = [];
	const unsatisfiable = [{fields: ['']}, {fields: [' ']}, {fieldsWhenPublic: ['']}, {fields: ['\t']}];

	for (const options of unsatisfiable) {
		try {
			verify(options);
			problems.push(`${JSON.stringify(options)} was accepted`);
		} catch (error) {
			if (!/should NOT|should match/u.test(error.message)) {
				problems.push(`${JSON.stringify(options)}: ${error.message}`);
			}
		}
	}

	assert.deepEqual(problems, []);
});
