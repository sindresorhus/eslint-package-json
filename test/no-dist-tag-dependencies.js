import {getTester} from './utils/test.js';

const {test} = getTester(import.meta);

test.snapshot({
	valid: [
		'{"dependencies": {"foo": "^1.0.0"}}',
		'{"dependencies": {"foo": "1.2.x"}}',
		// Wildcards are handled by `no-wildcard-dependencies`.
		'{"dependencies": {"foo": "*"}}',
		// Protocols and shorthands are not dist-tags.
		'{"dependencies": {"foo": "workspace:*"}}',
		'{"dependencies": {"foo": "file:../foo"}}',
		'{"dependencies": {"foo": "github:user/repo"}}',
		'{"dependencies": {"foo": "npm:bar@^1.0.0"}}',
		// A non-string value is malformed and left to other rules, not passed to semver.
		'{"dependencies": {"foo": 123}}',
	],
	invalid: [
		'{"dependencies": {"foo": "latest"}}',
		'{"dependencies": {"foo": "next"}}',
		'{"devDependencies": {"foo": "beta"}}',
	],
});
