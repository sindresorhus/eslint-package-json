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
	],
	invalid: [
		'{"dependencies": {"foo": "1.0.0"}}',
		'{"dependencies": {"foo": "~1.0.0"}}',
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
	],
});
