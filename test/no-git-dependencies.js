import {getTester} from './utils/test.js';

const {test} = getTester(import.meta);

test.snapshot({
	valid: [
		// Registry specifiers are fine.
		'{"dependencies": {"foo": "^1.0.0"}}',
		'{"dependencies": {"foo": "1.0.0"}}',
		'{"dependencies": {"foo": "latest"}}',
		// Workspace: protocol is not a git specifier.
		'{"dependencies": {"foo": "workspace:^"}}',
		// Local paths are not git (must not be matched by the bare owner/repo shorthand).
		'{"dependencies": {"foo": "file:../foo"}}',
		'{"dependencies": {"foo": "./foo"}}',
		'{"dependencies": {"foo": "../foo"}}',
		'{"dependencies": {"foo": "./packages/foo"}}',
		// Non-string values are ignored.
		'{"dependencies": {"foo": 1}}',
		// No dependencies field.
		'{"name": "my-package"}',
		// AllowWithRef: true allows specifiers with a ref.
		{
			code: '{"dependencies": {"foo": "github:user/repo#v1.0.0"}}',
			options: [{allowWithRef: true}],
		},
		{
			code: '{"dependencies": {"foo": "git+https://github.com/user/repo.git#abc123"}}',
			options: [{allowWithRef: true}],
		},
		{
			code: '{"dependencies": {"foo": "user/repo#semver:^1.0.0"}}',
			options: [{allowWithRef: true}],
		},
	],
	invalid: [
		// Git+ prefix.
		'{"dependencies": {"foo": "git+https://github.com/user/repo.git"}}',
		// git:// protocol.
		'{"dependencies": {"foo": "git://github.com/user/repo.git"}}',
		// Github: shorthand.
		'{"dependencies": {"foo": "github:user/repo"}}',
		// Gitlab: shorthand.
		'{"dependencies": {"foo": "gitlab:user/repo"}}',
		// Bitbucket: shorthand.
		'{"dependencies": {"foo": "bitbucket:user/repo"}}',
		// .git suffix.
		'{"dependencies": {"foo": "https://github.com/user/repo.git"}}',
		// .git suffix with a ref.
		'{"dependencies": {"foo": "https://github.com/user/repo.git#v1.0.0"}}',
		// SCP-style SSH shorthand without a `.git` suffix.
		'{"dependencies": {"foo": "git@github.com:user/repo"}}',
		// Bare owner/repo shorthand.
		'{"dependencies": {"foo": "user/repo"}}',
		// Bare shorthand with a dot in the owner (npm resolves this as a github shorthand).
		'{"dependencies": {"foo": "my.org/repo"}}',
		// Bare owner/repo with ref (without allowWithRef).
		'{"dependencies": {"foo": "user/repo#v1.0.0"}}',
		// Github: without ref (allowWithRef: false by default).
		{
			code: '{"dependencies": {"foo": "github:user/repo"}}',
			options: [{allowWithRef: false}],
		},
		// DevDependencies.
		'{"devDependencies": {"foo": "git+https://github.com/user/repo.git"}}',
	],
});
