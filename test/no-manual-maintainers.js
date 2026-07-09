import {getTester} from './utils/test.js';

const {test} = getTester(import.meta);

test.snapshot({
	valid: [
		'{"name": "foo"}',
		'{"author": "Jane Doe <jane@example.com>"}',
	],
	invalid: [
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
		// Empty `maintainers` array: nothing to move, only the remove suggestion is offered.
		'{"maintainers": []}',
		// Non-array `contributors`: too malformed to merge into, only the remove suggestion is offered.
		'{"contributors": "John Smith", "maintainers": ["Jane Doe <jane@example.com>"]}',
	],
});
