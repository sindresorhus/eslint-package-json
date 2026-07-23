/* eslint-disable node-test/no-conditional-assertion -- The path matrix asserts each case inside a loop. */
import {test as nodeTest} from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {Linter} from 'eslint';
import json from '@eslint/json';
import {getTester} from './utils/test.js';

const {rule, test} = getTester(import.meta);
const nestedPackageFilename = 'dist/package.json';

test.snapshot({
	valid: [
		'{"exports": "./index.js", "imports": {"#internal": "./internal.js"}}',
		{code: '{"exports": "./index.js", "imports": {"#internal": "./internal.js"}}', filename: '<text>'},
		{code: '{"exports": "./index.js"}', filename: 'dist/config.json'},
		{code: '{"name": "foo"}', filename: nestedPackageFilename},
		{code: '[]', filename: nestedPackageFilename},
	],
	invalid: [
		{code: '{"exports": "./index.js"}', filename: nestedPackageFilename},
		{code: '{"imports": {"#internal": "./internal.js"}}', filename: nestedPackageFilename},
		{code: '{"exports": "./index.js", "imports": null}', filename: nestedPackageFilename},
		{code: '{"exports": "./first.js", "exports": "./second.js"}', filename: nestedPackageFilename},
		// An adjacent run of duplicates ending the object takes the comma before it.
		{code: '{"name": "foo", "exports": "./first.js", "exports": "./second.js"}', filename: nestedPackageFilename},
		// An adjacent run of duplicates opening the object takes the comma after it.
		{code: '{"exports": "./first.js", "exports": "./second.js", "name": "foo"}', filename: nestedPackageFilename},
		// Duplicates separated by a kept member remove as two runs, so neither fix range may overlap the other.
		{code: '{"exports": "./first.js", "name": "foo", "exports": "./second.js"}', filename: nestedPackageFilename},
		{code: '{"imports": {"#first": "./first.js"}, "imports": {"#second": "./second.js"}}', filename: nestedPackageFilename},
		{
			code: `{
				"name": "foo",
				"exports": "./index.js",
				"version": "1.0.0"
			}`,
			filename: nestedPackageFilename,
		},
	],
});

nodeTest('handles package.json paths relative to the configured working directory', () => {
	const workingDirectory = path.resolve('test');
	const linter = new Linter({cwd: workingDirectory});
	const config = {
		files: ['**'],
		language: 'json/json',
		plugins: {
			json,
			'rule-to-test': {
				rules: {
					'no-nested-exports': rule,
				},
			},
		},
		rules: {
			'rule-to-test/no-nested-exports': 'error',
		},
	};

	const testCases = [
		{physicalFilename: 'package.json', reports: false},
		{physicalFilename: 'dist/package.json', reports: true},
		{physicalFilename: '<text>', reports: false},
		{physicalFilename: '../package.json', reports: false},
		{physicalFilename: '../other/package.json', reports: false},
		{physicalFilename: path.resolve(workingDirectory, 'package.json'), reports: false},
		{physicalFilename: path.resolve(workingDirectory, 'dist/package.json'), reports: true},
		{physicalFilename: path.resolve(workingDirectory, '../package.json'), reports: false},
		{physicalFilename: path.resolve(workingDirectory, '../other/package.json'), reports: false},
	];

	for (const {physicalFilename, reports} of testCases) {
		const messages = linter.verify('{"exports": "./index.js"}', config, {
			filename: nestedPackageFilename,
			physicalFilename,
		});

		assert.equal(messages.length, reports ? 1 : 0, physicalFilename);
	}
});
