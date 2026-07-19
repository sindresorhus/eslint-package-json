import {getTester} from './utils/test.js';

const {test} = getTester(import.meta);

test.snapshot({
	valid: [
		'{"workspaces": ["packages/*"], "private": true}',
		// No `workspaces`, so no requirement.
		'{"name": "foo"}',
		'{"name": "foo", "private": false}',
	],
	invalid: [
		// Preserve compact formatting when adding `private`.
		'{"workspaces": ["packages/*"]}',
		// Missing `private`.
		`{
	"name": "foo",
	"workspaces": [
		"packages/*"
	]
}`,
		// Yarn classic object form.
		`{
	"name": "foo",
	"workspaces": {
		"packages": [
			"packages/*"
		]
	}
}`,
		// Present but not \`true\`.
		`{
	"name": "foo",
	"private": false,
	"workspaces": [
		"packages/*"
	]
}`,
	],
});
