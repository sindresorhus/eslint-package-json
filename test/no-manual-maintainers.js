import {getTester} from './utils/test.js';

const {test} = getTester(import.meta);

test.snapshot({
	valid: [
		'{"name": "foo"}',
		'{"author": "Jane Doe <jane@example.com>"}',
	],
	invalid: [
		// A shadowed duplicate must not survive either suggestion.
		'{"maintainers": ["a"], "maintainers": ["b"]}',
		'{"maintainers": ["a"], "x": 1, "maintainers": ["b"]}',
		// No `contributors` field: offers renaming `maintainers` to `contributors`.
		`{
	"name": "foo",
	"maintainers": [
		"Jane Doe <jane@example.com>"
	]
}`,
		// Existing `contributors` array: offers merging the entries into it.
		`{
	"name": "foo",
	"contributors": [
		"John Smith <john@example.com>"
	],
	"maintainers": [
		"Jane Doe <jane@example.com>"
	]
}`,
		// Existing empty `contributors` array: offers merging the entries into it.
		`{
	"name": "foo",
	"contributors": [],
	"maintainers": [
		"Jane Doe <jane@example.com>"
	]
}`,
		// A single-line `contributors` array: the moved entries stay on the same line instead of breaking onto an unindented one.
		'{"contributors": ["Bob"], "maintainers": ["Alice", "Carol"]}',
		// Empty `maintainers` array: nothing to move, only the remove suggestion is offered.
		'{"maintainers": []}',
		// Non-array `contributors`: too malformed to merge into, only the remove suggestion is offered.
		'{"contributors": "John Smith", "maintainers": ["Jane Doe <jane@example.com>"]}',
		// An existing but empty `contributors` array written on one line stays on one line.
		'{"maintainers": [{"name": "a"}], "contributors": []}',
		// A one-line empty array stays on one line in a multiline document too.
		'{\n\t"maintainers": [{"name": "a"}],\n\t"contributors": []\n}',
		// An empty array written across lines is rewritten rather than appended to, so the closing indent the author wrote does not end up alone on a line.
		'{\n\t"maintainers": [\n\t\t"a"\n\t],\n\t"contributors": [\n\t]\n}',
		// Several entries moved into a one-line empty array are spaced the way the non-empty branch spaces them.
		'{"contributors": [], "maintainers": ["a", "b"]}',
	],
});
