import {getTester} from './utils/test.js';

const {test} = getTester(import.meta);

test.snapshot({
	valid: [
		'{"name": "foo"}',
		'{"keywords": ["a"]}',
		'{"scripts": {"test": "ava"}}',
		'{"description": "x"}',
		// Non-collection values (boolean/number/null) are never "empty".
		'{"sideEffects": false}',
		'{"private": true}',
		// Ignored via option.
		{
			code: '{"files": []}',
			options: [{ignore: ['files']}],
		},
	],
	invalid: [
		'{"keywords": []}',
		'{"scripts": {}}',
		'{"description": ""}',
		'{"name": "foo", "keywords": [], "scripts": {}}',
		// First and last members removal.
		'{"keywords": [], "name": "foo"}',
		'{"name": "foo", "keywords": []}',
		'{"files": []}',
		// Multiline single-member removal should collapse to `{}`.
		'{\n\t"keywords": []\n}',
	],
});
