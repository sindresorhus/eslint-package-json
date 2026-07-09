import {getTester} from './utils/test.js';

const {test} = getTester(import.meta);

test.snapshot({
	valid: [
		// No banned packages configured, nothing is flagged.
		'{"dependencies": {"foo": "^1.0.0"}}',
		// Package not in banned list.
		{
			code: '{"dependencies": {"foo": "^1.0.0"}}',
			options: [{packages: ['bar']}],
		},
		// Empty packages list.
		{
			code: '{"dependencies": {"foo": "^1.0.0"}}',
			options: [{packages: []}],
		},
		// No dependencies field.
		'{"name": "my-package"}',
		// Non-string value for a banned package name is still flagged by name, but test no-dependency case.
		{
			code: '{"dependencies": {"baz": "^1.0.0"}}',
			options: [{packages: ['foo', 'bar']}],
		},
	],
	invalid: [
		// String entry, default message.
		{
			code: '{"dependencies": {"foo": "^1.0.0"}}',
			options: [{packages: ['foo']}],
		},
		// Object entry with custom message.
		{
			code: '{"dependencies": {"foo": "^1.0.0"}}',
			options: [{packages: [{name: 'foo', message: 'Use bar instead.'}]}],
		},
		// Object entry without custom message (uses default).
		{
			code: '{"dependencies": {"foo": "^1.0.0"}}',
			options: [{packages: [{name: 'foo'}]}],
		},
		// Empty custom message falls back to the default message.
		{
			code: '{"dependencies": {"foo": "^1.0.0"}}',
			options: [{packages: [{name: 'foo', message: ''}]}],
		},
		// Multiple packages banned, one matches.
		{
			code: '{"dependencies": {"foo": "^1.0.0", "bar": "^2.0.0"}}',
			options: [{packages: ['foo', 'baz']}],
		},
		// DevDependencies.
		{
			code: '{"devDependencies": {"foo": "^1.0.0"}}',
			options: [{packages: ['foo']}],
		},
		// PeerDependencies.
		{
			code: '{"peerDependencies": {"foo": "*"}}',
			options: [{packages: ['foo']}],
		},
		// OptionalDependencies.
		{
			code: '{"optionalDependencies": {"foo": "^1.0.0"}}',
			options: [{packages: ['foo']}],
		},
		// Both string and object entries.
		{
			code: '{"dependencies": {"foo": "^1.0.0", "bar": "^2.0.0"}}',
			options: [{packages: ['foo', {name: 'bar', message: 'Deprecated.'}]}],
		},
	],
});
