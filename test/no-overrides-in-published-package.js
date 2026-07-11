import {getTester} from './utils/test.js';

const {test} = getTester(import.meta);

test.snapshot({
	valid: [
		'{}',
		'"not an object"',
		'{"private": true, "overrides": {}}',
		'{"private": true, "overrides": {"foo": "1.0.0"}}',
		'{"private": true, "overrides": {"foo": {"bar": "1.0.0"}}}',
		// Invalid `overrides` values are left to `valid-fields` for private packages.
		'{"private": true, "overrides": []}',
	],
	invalid: [
		// Sole property.
		'{\n\t"overrides": {}\n}',
		// First property.
		'{\n\t"overrides": {\n\t\t"foo": "1.0.0"\n\t},\n\t"name": "foo"\n}',
		// Middle property.
		'{\n\t"name": "foo",\n\t"overrides": {\n\t\t"foo": "1.0.0"\n\t},\n\t"version": "1.0.0"\n}',
		// Last property and nested overrides.
		'{\n\t"name": "foo",\n\t"overrides": {\n\t\t"foo": {\n\t\t\t"bar": "1.0.0"\n\t\t}\n\t}\n}',
		// Empty and malformed overrides are still dead metadata in a publishable package.
		'{"name": "foo", "overrides": []}',
		// Explicitly non-private packages can be published.
		'{"private": false, "overrides": {"foo": "1.0.0"}}',
		// Non-boolean `private` values do not meet the package's private-package contract.
		'{"private": "true", "overrides": {}}',
		'{"private": 1, "overrides": {}}',
		'{"private": {}, "overrides": {}}',
		'{"private": [], "overrides": {}}',
		'{"private": "", "overrides": {}}',
		'{"private": 0, "overrides": {}}',
		'{"private": null, "overrides": {}}',
	],
});
