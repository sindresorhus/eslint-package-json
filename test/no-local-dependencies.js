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
		// DevDependencies with local path is also flagged (covered in invalid), but valid example: none.
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
		// DevDependencies.
		'{"devDependencies": {"foo": "file:../foo"}}',
		// PeerDependencies.
		'{"peerDependencies": {"foo": "file:../foo"}}',
		// OptionalDependencies.
		'{"optionalDependencies": {"foo": "file:../foo"}}',
		// Multiple dependencies.
		'{"dependencies": {"foo": "file:../foo", "bar": "^1.0.0", "baz": "../baz"}}',
	],
});
