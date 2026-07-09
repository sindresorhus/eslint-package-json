import {getTester} from './utils/test.js';

const {test} = getTester(import.meta);

test.snapshot({
	valid: [
		'{"dependencies": {"foo": "^1.0.0"}}',
		'{"dependencies": {"foo": "1.2.3"}}',
		'{"dependencies": {"foo": "~1.2.0"}}',
		'{"dependencies": {"foo": ">=1.0.0 <2.0.0"}}',
		// Tags and non-semver specifiers are not wildcards.
		'{"dependencies": {"foo": "latest"}}',
		'{"dependencies": {"foo": "workspace:*"}}',
		'{"dependencies": {"foo": "file:../foo"}}',
		'{"dependencies": {"foo": "github:user/repo"}}',
		// `*` in `peerDependencies` is allowed by default.
		'{"peerDependencies": {"react": "*"}}',
		// Non-string values are ignored.
		'{"dependencies": {"foo": 1}}',
		// Ignored package name.
		{
			code: '{"dependencies": {"foo": "*"}}',
			options: [{ignore: ['foo']}],
		},
	],
	invalid: [
		'{"dependencies": {"foo": "*"}}',
		'{"dependencies": {"foo": ""}}',
		'{"dependencies": {"foo": "x"}}',
		'{"dependencies": {"foo": "X"}}',
		'{"devDependencies": {"foo": "*"}}',
		'{"optionalDependencies": {"foo": "*"}}',
		// `peerDependencies` flagged only when opted in.
		{
			code: '{"peerDependencies": {"react": "*"}}',
			options: [{dependencyTypes: ['peerDependencies']}],
		},
	],
});
