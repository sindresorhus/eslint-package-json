import {getTester} from './utils/test.js';

const {test} = getTester(import.meta);
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
