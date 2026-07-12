import {getTester} from './utils/test.js';

const {test} = getTester(import.meta);
const fixturePackageFilename = 'test/fixtures/require-bin-shebang/package.json';

test.snapshot({
	valid: [
		'{"name": "foo"}',
		{code: '{"bin": "valid.js"}', filename: fixturePackageFilename},
		{code: '{"bin": "./valid.mjs"}', filename: fixturePackageFilename},
		{code: '{"bin": "eof.js"}', filename: fixturePackageFilename},
		{code: '{"bin": "uppercase.JS"}', filename: fixturePackageFilename},
		{code: '{"bin": {"foo": "valid.js", "bar": "valid.cjs"}}', filename: fixturePackageFilename},
		{code: '{"bin": {"foo": "unsupported.txt"}}', filename: fixturePackageFilename},
		{code: '{"bin": {"foo": "missing.js"}}', filename: fixturePackageFilename},
		{code: '{"bin": {"foo": "../index.js"}}', filename: fixturePackageFilename},
		{code: '{"bin": "outside.js"}', filename: fixturePackageFilename},
		{code: '{"bin": "directory.js"}', filename: fixturePackageFilename},
		{code: '{"bin": ""}', filename: fixturePackageFilename},
		{code: '{"bin": {"foo": 123}}', filename: fixturePackageFilename},
		{code: '{"directories": {"bin": "invalid.js"}}', filename: fixturePackageFilename},
		{code: '{"bin": "invalid.js"}', filename: '<text>'},
	],
	invalid: [
		{code: '{"bin": "invalid.js"}', filename: fixturePackageFilename},
		{code: '{"bin": "wrong-shebang.js"}', filename: fixturePackageFilename},
		{code: '{"bin": "wrong-interpreter.js"}', filename: fixturePackageFilename},
		{code: '{"bin": "crlf.js"}', filename: fixturePackageFilename},
		{code: '{"bin": "bom.js"}', filename: fixturePackageFilename},
		{code: '{"bin": "invalid-no-newline.js"}', filename: fixturePackageFilename},
		{code: '{"bin": {"foo": "invalid.js"}}', filename: fixturePackageFilename},
		{code: '{"bin": {"foo": "invalid.js", "bar": "wrong-shebang.js"}}', filename: fixturePackageFilename},
		{code: '{"bin": "inside.js"}', filename: fixturePackageFilename},
		{code: '{"bin": "invalid.cjs"}', filename: fixturePackageFilename},
		{code: '{"bin": "invalid.mjs"}', filename: fixturePackageFilename},
	],
});
