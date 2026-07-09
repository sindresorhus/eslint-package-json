import {getTester} from './utils/test.js';

const {test} = getTester(import.meta);

test.snapshot({
	valid: [
		'{"main": "./dist/index.js"}',
		'{"bin": {"foo": "./cli.js"}}',
		'{"exports": {"import": "./index.mjs"}}',
		'{"files": ["dist/**"]}',
		// Non-path fields are not scanned, even with backslashes.
		String.raw`{"config": {"outDir": "build\\out"}}`,
	],
	invalid: [
		String.raw`{"main": ".\\dist\\index.js"}`,
		String.raw`{"bin": {"foo": ".\\cli.js"}}`,
		String.raw`{"exports": {"import": ".\\index.mjs"}}`,
		String.raw`{"files": [".\\dist"]}`,
		String.raw`{"types": ".\\index.d.ts"}`,
	],
});
