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
		// An `npm:` alias carries a real range, so it is not a wildcard either.
		'{"dependencies": {"foo": "npm:bar@^1.0.0"}}',
		'{"dependencies": {"foo": "npm:bar@1.2.3"}}',
		'{"dependencies": {"foo": "npm:@scope/bar@~1.2.0"}}',
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
		// An `npm:` alias with no range installs whatever is newest, which is the wildcard case by another name.
		'{"dependencies": {"foo": "npm:bar@*"}}',
		'{"dependencies": {"foo": "npm:bar@x"}}',
		'{"dependencies": {"foo": "npm:bar"}}',
		// `peerDependencies` flagged only when opted in.
		{
			code: '{"peerDependencies": {"react": "*"}}',
			options: [{dependencyTypes: ['peerDependencies']}],
		},
	],
});
