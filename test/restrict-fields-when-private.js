import {getTester} from './utils/test.js';

const {test} = getTester(import.meta);

test.snapshot({
	valid: [
		// Not private — no report.
		'{"name": "foo", "publishConfig": {"access": "public"}, "files": ["dist"]}',
		// Private: false — no report.
		'{"name": "foo", "private": false, "publishConfig": {"access": "public"}}',
		// Private: true but none of the default fields present.
		'{"name": "foo", "private": true, "version": "1.0.0"}',
		// Private as a string — not a boolean, no report.
		'{"name": "foo", "private": "true", "publishConfig": {}}',
		// Custom fields, none present.
		{
			code: '{"name": "foo", "private": true}',
			options: [{fields: ['funding']}],
		},
		// Default fields not present when private.
		'{"private": true, "name": "foo"}',
	],
	invalid: [
		// Private: true with publishConfig (default fields).
		'{"name": "foo", "private": true, "publishConfig": {"access": "public"}}',
		// Private: true with files (default fields).
		'{"name": "foo", "private": true, "files": ["dist"]}',
		// Private: true with both default fields.
		'{"name": "foo", "private": true, "publishConfig": {}, "files": []}',
		// Custom fields.
		{
			code: '{"name": "foo", "private": true, "funding": "https://example.com"}',
			options: [{fields: ['funding']}],
		},
		// First and last member removal.
		{
			code: '{"publishConfig": {}, "private": true, "name": "foo"}',
			options: [{fields: ['publishConfig']}],
		},
		{
			code: '{"name": "foo", "private": true, "files": ["dist"]}',
			options: [{fields: ['files']}],
		},
		// Multiline object — removal preserves the remaining members' formatting.
		{
			code: '{\n\t"name": "foo",\n\t"private": true,\n\t"files": ["dist"]\n}',
			options: [{fields: ['files']}],
		},
	],
});
