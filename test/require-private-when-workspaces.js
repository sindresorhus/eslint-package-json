import {getTester} from './utils/test.js';

const {test} = getTester(import.meta);

test.snapshot({
	valid: [
		'{"workspaces": ["packages/*"], "private": true}',
		// No `workspaces`, so no requirement.
		'{"name": "foo"}',
		'{"name": "foo", "private": false}',
		// An empty list declares no workspace, so there is no monorepo root to keep unpublished.
		'{"workspaces": []}',
		'{"workspaces": {"packages": []}}',
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
		// A shape npm rejects outright is a broken monorepo root either way, so it is still reported.
		'{"workspaces": {"nohoist": []}}',
		'{"workspaces": 1}',
		// A monorepo root often has no field that ranks before `private`, so it goes first rather than last.
		'{\n\t"workspaces": [\n\t\t"packages/*"\n\t],\n\t"devDependencies": {\n\t\t"xo": "^1.0.0"\n\t}\n}',
	],
});
