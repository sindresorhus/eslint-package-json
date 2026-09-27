import {getTester} from './utils/test.js';

const {test} = getTester(import.meta);

test.snapshot({
	valid: [
		// Default range is caret.
		'{"dependencies": {"foo": "^1.0.0"}}',
		// Non-convertible specifiers are ignored.
		'{"dependencies": {"foo": "workspace:^"}}',
		'{"dependencies": {"foo": "*"}}',
		'{"dependencies": {"foo": "latest"}}',
		'{"dependencies": {"foo": ">=1.0.0 <2.0.0"}}',
		'{"dependencies": {"foo": "1.x"}}',
		'{"dependencies": {"foo": "github:user/repo"}}',
		// Exceptions.
		{
			code: '{"dependencies": {"foo": "1.0.0"}}',
			options: [{exceptions: ['foo']}],
		},
		// Only configured dependency types are checked.
		{
			code: '{"devDependencies": {"foo": "1.0.0"}}',
			options: [{range: 'caret', dependencyTypes: ['dependencies']}],
		},
		// `consistent`: a single style throughout is allowed.
		{
			code: '{"dependencies": {"a": "~1.0.0", "b": "~2.0.0"}}',
			options: [{range: 'consistent'}],
		},
		// `consistent` is computed only within the configured groups, so a differing `devDependencies` is ignored.
		{
			code: '{"dependencies": {"a": "^1.0.0", "b": "^2.0.0"}, "devDependencies": {"c": "~3.0.0"}}',
			options: [{range: 'consistent', dependencyTypes: ['dependencies']}],
		},
		// `consistent`: nothing classifiable means there is no dominant style to enforce.
		{
			code: '{"dependencies": {"foo": "latest", "bar": "workspace:^"}}',
			options: [{range: 'consistent'}],
		},
		// An `npm:` alias carrying a range is classified by that range, so a caret one is already the default.
		'{"dependencies": {"foo": "npm:bar@^1.0.0"}}',
		'{"dependencies": {"foo": "npm:@scope/bar@latest"}}',
	],
	invalid: [
		// A tie between tilde and exact resolves by the fixed caret/tilde/exact preference.
		{
			code: '{"dependencies": {"a": "~1.0.0", "b": "2.0.0"}}',
			options: [{range: 'consistent'}],
		},
		'{"dependencies": {"foo": "1.0.0"}}',
		'{"dependencies": {"foo": "~1.0.0"}}',
		// An `npm:` alias carrying an exact version is one too, and the suggestion keeps the alias.
		'{"dependencies": {"foo": "npm:bar@1.0.0"}}',
		'{"dependencies": {"foo": "npm:@scope/bar@1.0.0"}}',
		'{"dependencies": {"foo": "npm:bar@1.0.0 ", "bar": "^1.0.0"}}',
		// A `v`-prefixed version normalizes to a clean `^1.0.0` suggestion, not `^v1.0.0`.
		'{"dependencies": {"foo": "v1.0.0"}}',
		{
			code: '{"dependencies": {"foo": "^1.0.0"}}',
			options: [{range: 'tilde'}],
		},
		{
			code: '{"dependencies": {"foo": "^1.2.3"}}',
			options: [{range: 'exact'}],
		},
		{
			code: '{"dependencies": {"a": "1.0.0"}, "devDependencies": {"b": "~2.0.0"}}',
			options: [{range: 'caret'}],
		},
		// All four default dependency groups are checked, including `optionalDependencies` and `peerDependencies`.
		'{"optionalDependencies": {"foo": "1.0.0"}}',
		'{"peerDependencies": {"foo": "1.0.0"}}',
		// `consistent`: the minority style (one tilde among carets) is flagged.
		{
			code: '{"dependencies": {"a": "^1.0.0", "b": "^2.0.0", "c": "~3.0.0"}}',
			options: [{range: 'consistent'}],
		},
		// An `=`-prefixed pin is exactly as restrictive as the bare form, which the default `caret` range
		// reports. A real comparator is a range and stays as written.
		'{"dependencies": {"a": "=1.2.3"}}',
		'{"dependencies": {"a": "=v1.2.3"}}',
		// A `+build` the author wrote is part of the version, so the rewritten range keeps it rather than
		// dropping it the way `semver.valid` does.
		'{"dependencies": {"a": "1.2.3+build.5"}}',
		'{"dependencies": {"a": "v1.2.3+build.5"}}',
	],
});
