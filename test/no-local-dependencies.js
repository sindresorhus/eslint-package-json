import {getTester} from './utils/test.js';

const {test} = getTester(import.meta);

test.snapshot({
	valid: [
		// Registry specifiers are fine.
		'{"dependencies": {"foo": "^1.0.0"}}',
		'{"dependencies": {"foo": "1.0.0"}}',
		'{"dependencies": {"foo": "latest"}}',
		// Workspace: protocol is not local.
		'{"dependencies": {"foo": "workspace:^"}}',
		// Git specifiers are not local.
		'{"dependencies": {"foo": "github:user/repo"}}',
		'{"dependencies": {"foo": "git+https://github.com/user/repo.git"}}',
		// Ignored package.
		{
			code: '{"dependencies": {"foo": "file:../foo"}}',
			options: [{ignore: ['foo']}],
		},
		// Non-string values are ignored.
		'{"dependencies": {"foo": 1}}',
		// No dependencies field.
		'{"name": "my-package"}',
		// A consumer never installs `devDependencies`, so a local path there breaks nobody. It is how packages point at test fixtures and self-link for dogfooding.
		'{"devDependencies": {"foo": "file:../foo"}}',
		'{"devDependencies": {"my-package": "file:."}}',
		'{"devDependencies": {"fixture": "./test/fixtures/fixture"}}',
	],
	invalid: [
		// File: protocol.
		'{"dependencies": {"foo": "file:../foo"}}',
		// Link: protocol.
		'{"dependencies": {"foo": "link:../foo"}}',
		// Relative paths.
		'{"dependencies": {"foo": "./foo"}}',
		'{"dependencies": {"foo": "../foo"}}',
		// Absolute path.
		'{"dependencies": {"foo": "/home/user/foo"}}',
		// Home directory path.
		'{"dependencies": {"foo": "~/foo"}}',
		// PeerDependencies.
		'{"peerDependencies": {"foo": "file:../foo"}}',
		'{"peerDependencies": {"foo": "link:../foo"}}',
		// OptionalDependencies.
		'{"optionalDependencies": {"foo": "file:../foo"}}',
		'{"optionalDependencies": {"foo": "link:../foo"}}',
		// Multiple dependencies.
		'{"dependencies": {"foo": "file:../foo", "bar": "^1.0.0", "baz": "../baz"}}',
	],
});
