import process from 'node:process';
import {getTester} from './utils/test.js';

const {test} = getTester(import.meta);
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

test.snapshot({
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
