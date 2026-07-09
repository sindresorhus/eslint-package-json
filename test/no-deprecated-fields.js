import {getTester} from './utils/test.js';

const {test} = getTester(import.meta);

test.snapshot({
	valid: [
		'{"name": "foo"}',
		'{"module": "index.js"}',
		'{"license": "MIT"}',
		'{"scripts": {"prepublishOnly": "build"}}',
		'{"scripts": {"prepare": "build"}}',
		'{"scripts": {"test": "node --test"}}',
		// `scripts` is not an object.
		'{"scripts": "build"}',
	],
	invalid: [
		'{"jsnext:main": "index.js"}',
		'{"preferGlobal": true}',
		'{"engineStrict": true}',
		'{"licenses": ["MIT"]}',
		'{"licenses": [{"type": "MIT", "url": "https://example.com/license"}]}',
		'{"modules": "index.js"}',
		'{"scripts": {"prepublish": "build"}}',
		'{"jsnext:main": "index.js", "scripts": {"prepublish": "build"}}',
	],
});
