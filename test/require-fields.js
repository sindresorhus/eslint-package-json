import {getTester} from './utils/test.js';

const {test} = getTester(import.meta);

test.snapshot({
	valid: [
		// Default fields present.
		'{"name": "foo", "version": "1.0.0", "license": "MIT", "keywords": ["x"], "description": "bar"}',
		// Extra fields are fine.
		'{"name": "foo", "version": "1.0.0", "license": "MIT", "keywords": ["x"], "description": "bar", "type": "module"}',
		// Custom `fields` present.
		{
			code: '{"name": "foo", "description": "bar"}',
			options: [{fields: ['name', 'description'], fieldsWhenPublic: []}],
		},
		// Empty `fields` list — nothing unconditionally required.
		{
			code: '{"name": "foo", "license": "MIT", "keywords": ["x"], "description": "bar"}',
			options: [{fields: []}],
		},
		// Single required field present.
		{
			code: '{"name": "foo", "license": "MIT", "keywords": ["x"], "description": "bar"}',
			options: [{fields: ['name']}],
		},
		// Private packages are exempt from `fieldsWhenPublic`.
		'{"name": "foo", "version": "1.0.0", "private": true}',
		// Custom `fieldsWhenPublic`.
		{
			code: '{"name": "foo", "version": "1.0.0", "author": "Sindre"}',
			options: [{fieldsWhenPublic: ['author']}],
		},
	],
	invalid: [
		// Missing `version` (default `fields`).
		'{"name": "foo", "license": "MIT", "keywords": ["x"], "description": "bar"}',
		// Missing `name` (default `fields`).
		'{"version": "1.0.0", "license": "MIT", "keywords": ["x"], "description": "bar"}',
		// Missing both default `fields`.
		'{"description": "no name or version"}',
		// Custom `fields` entry missing.
		{
			code: '{"name": "foo"}',
			options: [{fields: ['name', 'license'], fieldsWhenPublic: []}],
		},
		// Overlapping `fields` and `fieldsWhenPublic` entries are only reported once.
		{
			code: '{"name": "foo", "version": "1.0.0", "keywords": ["x"], "description": "bar"}',
			options: [{fields: ['name', 'version', 'license']}],
		},
		// Completely empty object.
		'{}',
		// Missing default `fieldsWhenPublic` entries.
		'{"name": "foo", "version": "1.0.0"}',
		// Missing only `description`.
		'{"name": "foo", "version": "1.0.0", "license": "MIT", "keywords": ["x"]}',
		// `"private": false` is not exempt.
		'{"name": "foo", "version": "1.0.0", "private": false}',
		// Custom `fieldsWhenPublic` entry missing.
		{
			code: '{"name": "foo", "version": "1.0.0"}',
			options: [{fieldsWhenPublic: ['description', 'license']}],
		},
	],
});
