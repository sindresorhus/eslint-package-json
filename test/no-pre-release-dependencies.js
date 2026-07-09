import {getTester} from './utils/test.js';

const {test} = getTester(import.meta);

test.snapshot({
	valid: [
		// Stable versions are fine.
		'{"dependencies": {"foo": "^1.0.0"}}',
		'{"dependencies": {"foo": "1.0.0"}}',
		'{"dependencies": {"foo": "~2.3.4"}}',
		// Tags are not semver ranges.
		'{"dependencies": {"foo": "latest"}}',
		// Workspace: protocol.
		'{"dependencies": {"foo": "workspace:^"}}',
		// Git specifiers are ignored (minVersion returns null).
		'{"dependencies": {"foo": "github:user/repo"}}',
		// Non-string values are ignored.
		'{"dependencies": {"foo": 1}}',
		// A hyphen range whose minimum is a stable version.
		'{"dependencies": {"foo": "1.0.0 - 2.0.0"}}',
		// A hyphenated specifier that `semver.minVersion` cannot parse is ignored.
		'{"dependencies": {"foo": "beta-1"}}',
		// No dependencies field.
		'{"name": "my-package"}',
		// Ignored package.
		{
			code: '{"dependencies": {"foo": "^1.0.0-alpha.1"}}',
			options: [{ignore: ['foo']}],
		},
	],
	invalid: [
		// Pre-release exact version.
		'{"dependencies": {"foo": "1.0.0-alpha.1"}}',
		// Pre-release with caret.
		'{"dependencies": {"foo": "^1.0.0-beta.2"}}',
		// Pre-release with tilde.
		'{"dependencies": {"foo": "~2.0.0-rc.1"}}',
		// DevDependencies.
		'{"devDependencies": {"foo": "^1.0.0-alpha.1"}}',
		// PeerDependencies.
		'{"peerDependencies": {"foo": "1.0.0-alpha.1"}}',
		// Multiple with some pre-release.
		'{"dependencies": {"foo": "^1.0.0", "bar": "^2.0.0-next.1"}}',
		// Compound range whose minimum is a pre-release.
		'{"dependencies": {"foo": ">=1.0.0-alpha <2.0.0"}}',
	],
});
