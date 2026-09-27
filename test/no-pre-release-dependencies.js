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
		// The `-0` upper bound excludes the next major's pre-releases instead of asking for one, so the range
		// starts at a stable version and is not a pre-release range. It is what `^1.0.0` normalizes to.
		'{"dependencies": {"foo": ">=1.0.0 <2.0.0-0"}}',
		'{"dependencies": {"foo": "1.x"}}',
		'{"dependencies": {"foo": "npm:bar@^1.0.0"}}',
		'{"dependencies": {"foo": "npm:bar@1.2.3"}}',
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
		// An `npm:` alias targets a pre-release when the range it carries does.
		'{"dependencies": {"foo": "npm:bar@1.0.0-beta"}}',
		'{"dependencies": {"foo": "npm:@scope/bar@2.0.0-rc.1"}}',
		// `npm-package-arg` resolves a specifier with semver's loose grammar, so a leading zero in a
		// pre-release identifier is a pre-release to npm.
		'{"dependencies": {"foo": "1.0.0-01"}}',
		'{"dependencies": {"foo": "01.2.3-01"}}',
		'{"dependencies": {"foo": "npm:bar@1.0.0-01"}}',
	],
});
