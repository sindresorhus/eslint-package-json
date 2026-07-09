import {getTester} from './utils/test.js';

const {test} = getTester(import.meta);

test.snapshot({
	valid: [
		'{"main": "./index.js"}',
		'{"exports": "./index.js"}',
		'{"bin": {"foo": "./cli.js"}}',
		// Private packages are not published, so no entry point is required.
		'{"name": "foo", "private": true}',
	],
	invalid: [
		'{"name": "foo"}',
		'{"name": "foo", "version": "1.0.0", "private": false}',
	],
});
