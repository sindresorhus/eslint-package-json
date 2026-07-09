import {getTester} from './utils/test.js';

const {test} = getTester(import.meta);

test.snapshot({
	valid: [
		'{"files": ["dist"]}',
		// Private packages are not published.
		'{"name": "foo", "private": true}',
	],
	invalid: [
		'{"name": "foo"}',
		'{"name": "foo", "private": false}',
	],
});
