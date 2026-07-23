import {getTester} from './utils/test.js';

const {test} = getTester(import.meta);

test.snapshot({
	valid: [
		'{"private": true}',
		'{"name": "foo", "private": true}',
		// The final duplicate key is the effective value.
		'{"private": false, "private": true}',
	],
	invalid: [
		// An empty package.json should get a complete valid object from the suggestion.
		'{}',
		// Missing `private`.
		'{"name": "foo"}',
		// Present but not `true`.
		'{"private": false}',
		'{"private": "true"}',
		'{"private": 1}',
		'{"private": null}',
		'{"private": []}',
		'{"private": {}}',
		// The final duplicate key is the effective value.
		'{"private": true, "private": false}',
		// Preserve the default indentation for an empty multiline object.
		'{\n}',
		// Preserve compact formatting when adding the field next to a nested object.
		'{"dependencies": {\n\t"foo": "1.0.0"\n}}',
		// Preserve multiline formatting when the first member shares the opening line.
		'{"name": "foo",\n\t"version": "1.0.0"}',
		// Preserve multiline formatting when adding the field.
		`{
			"name": "foo",
			"version": "1.0.0"
		}`,
		// Preserve CRLF newlines.
		'{\r\n\t"name": "foo"\r\n}',
	],
});
