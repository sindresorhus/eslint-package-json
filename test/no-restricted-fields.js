import {getTester} from './utils/test.js';

const {test} = getTester(import.meta);

test.snapshot({
	valid: [
		// No fields configured — nothing is restricted.
		'{"name": "foo", "version": "1.0.0"}',
		// Restricted field not present.
		{
			code: '{"name": "foo"}',
			options: [{fields: ['funding']}],
		},
		// Restricted field not present (object form).
		{
			code: '{"name": "foo"}',
			options: [{fields: [{field: 'funding', message: 'Do not use funding.'}]}],
		},
	],
	invalid: [
		// String entry — default message.
		{
			code: '{"name": "foo", "funding": "https://example.com"}',
			options: [{fields: ['funding']}],
		},
		// Object entry with custom message.
		{
			code: '{"name": "foo", "funding": "https://example.com"}',
			options: [{fields: [{field: 'funding', message: 'Funding is not allowed in this project.'}]}],
		},
		// Object entry without message — uses default.
		{
			code: '{"name": "foo", "funding": "https://example.com"}',
			options: [{fields: [{field: 'funding'}]}],
		},
		// Empty custom message — falls back to the default.
		{
			code: '{"name": "foo", "funding": "https://example.com"}',
			options: [{fields: [{field: 'funding', message: ''}]}],
		},
		// Multiple restricted fields — both reported.
		{
			code: '{"name": "foo", "funding": "x", "browser": "index.js"}',
			options: [{fields: ['funding', 'browser']}],
		},
		// First and last member removal.
		{
			code: '{"funding": "x", "name": "foo"}',
			options: [{fields: ['funding']}],
		},
		{
			code: '{"name": "foo", "funding": "x"}',
			options: [{fields: ['funding']}],
		},
		// Only member — removal leaves an empty object.
		{
			code: '{"funding": "x"}',
			options: [{fields: ['funding']}],
		},
		// Multiline object — removal preserves the remaining members' formatting.
		{
			code: '{\n\t"funding": "x",\n\t"name": "foo"\n}',
			options: [{fields: ['funding']}],
		},
		// Multiline object — removing the last member keeps the preceding member intact.
		{
			code: '{\n\t"name": "foo",\n\t"funding": "x"\n}',
			options: [{fields: ['funding']}],
		},
	],
});
