import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import test from 'node:test';
import {Linter} from 'eslint';
import json from '@eslint/json';
import {getTester} from './utils/test.js';

const {test: snapshotTest, rule} = getTester(import.meta);
const fixturePackageFilename = 'test/fixtures/require-bin-executable/package.json';

const permissionCases = [
	{code: '{"bin": "not-executable.js"}', filename: fixturePackageFilename},
	{code: '{"bin": "not-executable"}', filename: fixturePackageFilename},
	{code: '{"bin": {"foo": "not-executable.js"}}', filename: fixturePackageFilename},
	{code: '{"bin": {"foo": "not-executable.js", "bar": "not-executable"}}', filename: fixturePackageFilename},
	{code: '{"bin": {"foo": "executable.js", "bar": "not-executable.js"}}', filename: fixturePackageFilename},
	{code: '{"bin": {"ignored": 123, "foo": "not-executable.js"}}', filename: fixturePackageFilename},
	{code: '{"bin": {"foo": "nested/not-executable.js"}}', filename: fixturePackageFilename},
	{code: '{"bin": "inside-not-executable.js"}', filename: fixturePackageFilename},
	// Only the final top-level `bin` field or object value per key is installed.
	{code: '{"bin": "executable.js", "bin": "not-executable.js"}', filename: fixturePackageFilename},
	{code: '{"bin": {"foo": "executable.js", "foo": "not-executable.js"}}', filename: fixturePackageFilename},
];

snapshotTest.snapshot({
	valid: [
		'{"name": "foo"}',
		{code: '{"bin": "executable.js"}', filename: fixturePackageFilename},
		{code: '{"bin": "executable"}', filename: fixturePackageFilename},
		{code: '{"bin": "executable-without-shebang.js"}', filename: fixturePackageFilename},
		{code: '{"bin": "./nested/executable.js"}', filename: fixturePackageFilename},
		{code: '{"bin": {"foo": "executable.js", "bar": "executable"}}', filename: fixturePackageFilename},
		{code: '{"bin": "inside-executable.js"}', filename: fixturePackageFilename},
		// A shadowed top-level field or object target is not installed.
		{code: '{"bin": "not-executable.js", "bin": "executable.js"}', filename: fixturePackageFilename},
		{code: '{"bin": {"foo": "not-executable.js", "foo": "executable.js"}}', filename: fixturePackageFilename},
		{code: '{"bin": "missing.js"}', filename: fixturePackageFilename},
		{code: '{"bin": "directory"}', filename: fixturePackageFilename},
		{code: '{"bin": "../../../index.js"}', filename: fixturePackageFilename},
		{code: '{"bin": "outside.js"}', filename: fixturePackageFilename},
		{code: '{"bin": ""}', filename: fixturePackageFilename},
		{code: '{"bin": 123}', filename: fixturePackageFilename},
		{code: '{"bin": {"foo": 123}}', filename: fixturePackageFilename},
		{code: '{"bin": "not-executable.js", "bin": 123}', filename: fixturePackageFilename},
		{code: '{"directories": {"bin": "not-executable.js"}}', filename: fixturePackageFilename},
		{code: '{"bin": "index.js"}', filename: '<text>'},
		...(process.platform === 'win32' ? permissionCases : []),
	],
	invalid: process.platform === 'win32' ? [] : permissionCases,
});

test('requires the owner execute bit', t => {
	const temporaryDirectory = path.resolve('.ai-temporary');
	fs.mkdirSync(temporaryDirectory, {recursive: true});
	const packageDirectory = fs.mkdtempSync(path.join(temporaryDirectory, 'require-bin-executable-'));
	t.after(() => {
		fs.rmSync(packageDirectory, {recursive: true, force: true});
	});

	const binFile = path.join(packageDirectory, 'cli.js');
	fs.writeFileSync(binFile, '#!/usr/bin/env node\n');
	fs.chmodSync(binFile, 0o611);

	const linter = new Linter({cwd: packageDirectory});
	const messages = linter.verify(
		'{"bin": "cli.js"}',
		{
			files: ['**'],
			language: 'json/json',
			plugins: {json, 'rule-to-test': {rules: {'require-bin-executable': rule}}},
			rules: {'rule-to-test/require-bin-executable': 'error'},
		},
		{filename: 'package.json'},
	);

	const expectedMessageIds = process.platform === 'win32' ? [] : ['invalidString'];
	t.assert.deepStrictEqual(messages.map(({messageId}) => messageId), expectedMessageIds);
});
