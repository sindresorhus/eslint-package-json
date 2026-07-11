import {getTester} from './utils/test.js';

const {test} = getTester(import.meta);

test.snapshot({
	valid: [
		'{}',
		'"not an object"',
		// Private packages can use workspace dependencies.
		'{\n'
		+ '\t"private": true,\n'
		+ '\t"dependencies": {"one": "workspace:*"},\n'
		+ '\t"devDependencies": {"two": "workspace:^"},\n'
		+ '\t"optionalDependencies": {"three": "workspace:~"},\n'
		+ '\t"peerDependencies": {"four": "workspace:^1.2.3"}\n'
		+ '}',
		// Standard ranges and other protocols are unaffected.
		'{"dependencies": {"one": "^1.0.0", "two": "file:../two", "three": "catalog:"}}',
		// The protocol is case-sensitive.
		'{"dependencies": {"one": "Workspace:*"}}',
		// Invalid dependency values are left to `valid-fields`.
		'{"dependencies": {"one": true}}',
	],
	invalid: [
		// Every standard dependency group is checked.
		'{"dependencies": {"one": "workspace:*"}, "devDependencies": {"two": "workspace:^"}, "optionalDependencies": {"three": "workspace:~"}, "peerDependencies": {"four": "workspace:^1.2.3"}}',
		// Explicitly non-private packages can be published.
		'{"private": false, "dependencies": {"one": "workspace:*"}}',
		// Non-boolean `private` values do not meet the private-package contract.
		'{"private": "true", "dependencies": {"one": "workspace:*"}}',
		'{"private": 1, "dependencies": {"one": "workspace:*"}}',
		'{"private": {}, "dependencies": {"one": "workspace:*"}}',
		'{"private": [], "dependencies": {"one": "workspace:*"}}',
		'{"private": null, "dependencies": {"one": "workspace:*"}}',
	],
});
