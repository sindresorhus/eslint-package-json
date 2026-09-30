import {getTester} from './utils/test.js';

const {test} = getTester(import.meta);

test.snapshot({
	valid: [
		// Already in canonical order.
		'{"name": "foo", "version": "1.0.0"}',
		'{"name": "foo", "version": "1.0.0", "description": "bar"}',
		// Single field.
		'{"name": "foo"}',
		// Empty object.
		'{}',
		// Unknown keys come after known keys in their original order.
		'{"name": "foo", "unknown": "x"}',
		// All unknown keys — their relative order is preserved (already sorted is fine).
		'{"zzzz": "a", "aaaa": "b"}',
		// Correct multiline order.
		'{\n\t"name": "foo",\n\t"version": "1.0.0",\n\t"dependencies": {}\n}',
		// Custom order option — sorted by the custom list.
		{
			code: '{"version": "1.0.0", "name": "foo"}',
			options: [{order: ['version', 'name']}],
		},
		// The dependency groups sit in the order `sort-dependencies` uses by default, so a manifest written the way this plugin documents is not rewritten.
		'{\n\t"dependencies": {},\n\t"devDependencies": {},\n\t"optionalDependencies": {},\n\t"peerDependencies": {},\n\t"peerDependenciesMeta": {}\n}',
		// A recognized field has a place in the canonical order, so it is not pushed to the end with the unknown ones. Npm silently renames `bundledDependencies` to `bundleDependencies`, so both sit together.
		'{\n\t"author": "A",\n\t"authors": ["A"],\n\t"contributors": ["B"]\n}',
		'{\n\t"version": "1.0.0",\n\t"bundledDependencies": ["a"],\n\t"bundleDependencies": ["a"],\n\t"overrides": {}\n}',
		'{\n\t"name": "x",\n\t"version": "1.0.0",\n\t"bundleDependencies": ["a"]\n}',
	],
	invalid: [
		// Version before name.
		'{"version": "1.0.0", "name": "foo"}',
		// Description before name.
		'{"description": "bar", "name": "foo", "version": "1.0.0"}',
		// Multiline — fix must preserve tab indentation.
		'{\n\t"version": "1.0.0",\n\t"name": "foo"\n}',
		// Multiline with 2-space indentation — fix must preserve spaces, not tabs.
		'{\n  "version": "1.0.0",\n  "name": "foo"\n}',
		// Mix of known and unknown keys — unknown keys go to the end.
		'{"unknown": "x", "name": "foo"}',
		// Dependencies before name.
		'{"dependencies": {"foo": "^1.0.0"}, "name": "foo", "version": "1.0.0"}',
		// Custom order option.
		{
			code: '{"name": "foo", "version": "1.0.0"}',
			options: [{order: ['version', 'name']}],
		},
	],
});
