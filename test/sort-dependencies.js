import {getTester} from './utils/test.js';

const {test} = getTester(import.meta);

test.snapshot({
	valid: [
		// Already alphabetically sorted.
		'{"dependencies": {"a": "^1.0.0", "b": "^2.0.0", "c": "^3.0.0"}}',
		// Empty dependency object.
		'{"dependencies": {}}',
		// Single entry.
		'{"dependencies": {"foo": "^1.0.0"}}',
		// DevDependencies sorted.
		'{"devDependencies": {"a": "^1.0.0", "b": "^2.0.0"}}',
		// PeerDependencies sorted.
		'{"peerDependencies": {"a": "^1.0.0", "b": "^2.0.0"}}',
		// PeerDependenciesMeta sorted.
		'{"peerDependenciesMeta": {"a": {}, "b": {}}}',
		// OptionalDependencies sorted.
		'{"optionalDependencies": {"a": "^1.0.0", "b": "^2.0.0"}}',
		// Scripts is NOT checked by default.
		'{"scripts": {"z": "run z", "a": "run a"}}',
		// Only the configured property is checked.
		{
			code: '{"devDependencies": {"z": "^1.0.0", "a": "^2.0.0"}}',
			options: [{properties: ['dependencies']}],
		},
		// Multiline, already sorted.
		'{\n\t"dependencies": {\n\t\t"a": "^1.0.0",\n\t\t"b": "^2.0.0"\n\t}\n}',
	],
	invalid: [
		// Unsorted dependencies.
		'{"dependencies": {"b": "^2.0.0", "a": "^1.0.0"}}',
		// Unsorted devDependencies.
		'{"devDependencies": {"z": "^1.0.0", "a": "^2.0.0"}}',
		// Unsorted peerDependencies.
		'{"peerDependencies": {"z": "^1.0.0", "a": "^2.0.0"}}',
		// Unsorted optionalDependencies.
		'{"optionalDependencies": {"z": "^1.0.0", "a": "^2.0.0"}}',
		// Unsorted peerDependenciesMeta.
		'{"peerDependenciesMeta": {"z": {}, "a": {}}}',
		// Multiline — fix must preserve tab indentation.
		'{\n\t"dependencies": {\n\t\t"b": "^2.0.0",\n\t\t"a": "^1.0.0"\n\t}\n}',
		// Multiline with 2-space indentation — fix must preserve spaces.
		'{\n  "dependencies": {\n    "b": "^2.0.0",\n    "a": "^1.0.0"\n  }\n}',
		// Scoped packages sort before unscoped by localeCompare (so this input is unsorted).
		'{"dependencies": {"zod": "^3.0.0", "@scope/a": "^1.0.0"}}',
		// CRLF line endings — fix must preserve them.
		'{\r\n\t"dependencies": {\r\n\t\t"b": "^2.0.0",\r\n\t\t"a": "^1.0.0"\r\n\t}\r\n}',
		// Custom properties option.
		{
			code: '{"scripts": {"z": "run z", "a": "run a"}}',
			options: [{properties: ['scripts']}],
		},
		// Multiple groups, both unsorted.
		'{"dependencies": {"b": "^1.0.0", "a": "^2.0.0"}, "devDependencies": {"z": "^1.0.0", "a": "^2.0.0"}}',
	],
});
