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
	const linter = new Linter();
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
		{physicalFilename: 'package.json', expectedMessageCount: 0},
		{physicalFilename: 'dist/package.json', expectedMessageCount: 1},
		{physicalFilename: '<text>', expectedMessageCount: 0},
		{physicalFilename: '../package.json', expectedMessageCount: 0},
		{physicalFilename: '../other/package.json', expectedMessageCount: 0},
		{physicalFilename: path.resolve('package.json'), expectedMessageCount: 0},
		{physicalFilename: path.resolve('dist/package.json'), expectedMessageCount: 1},
		{physicalFilename: path.resolve('../package.json'), expectedMessageCount: 0},
		{physicalFilename: path.resolve('../other/package.json'), expectedMessageCount: 0},
	];

	const results = [];

	for (const {physicalFilename, expectedMessageCount} of testCases) {
		const messages = linter.verify('{"exports": "./index.js"}', config, {
			filename: nestedPackageFilename,
			physicalFilename,
		});

		results.push({physicalFilename, messageCount: messages.length});
	}

	assert.deepEqual(results, testCases.map(({physicalFilename, expectedMessageCount}) => ({
		physicalFilename,
		messageCount: expectedMessageCount,
	})));
});
