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
		// A `.git` suffix does not turn a local path into a git remote: npm resolves all of these as directories, and `no-local-dependencies` is the rule that reports them.
		'{"dependencies": {"foo": "file:../foo.git"}}',
		'{"dependencies": {"foo": "../foo.git"}}',
		'{"dependencies": {"foo": "./foo.git"}}',
		'{"dependencies": {"foo": "/abs/foo.git"}}',
		'{"dependencies": {"foo": "C:/repo.git"}}',
		String.raw`{"dependencies": {"foo": "C:\\repo.git"}}`,
		'{"dependencies": {"foo": "link:../foo.git"}}',
		// Non-string values are ignored.
		'{"dependencies": {"foo": 1}}',
		// No dependencies field.
		'{"name": "my-package"}',
		// Npm keys on the host, not the suffix: a `.git` on an unhosted URL is a tarball it downloads, and `no-http-dependencies` reports it, whatever the case of the suffix.
		'{"dependencies": {"foo": "https://example.com/user/repo.GIT"}}',
		'{"dependencies": {"foo": "https://example.com/user/repo.git"}}',
		'{"dependencies": {"foo": "https://example.com/user/repo.git#v1"}}',
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
		// Npm refuses these protocols rather than cloning them, so they are not git dependencies.
		'{"dependencies": {"foo": "git+foo://example.com/repo"}}',
		'{"dependencies": {"foo": "ssh://git@example.com/repo"}}',
	],
	invalid: [
		// A `git+` URL is a git remote with or without a `.git` suffix.
		'{"dependencies": {"a": "git+https://example.com/u/r"}}',
		// Git+ prefix.
		'{"dependencies": {"foo": "git+https://github.com/user/repo.git"}}',
		// git:// protocol, with and without the `.git` suffix.
		'{"dependencies": {"foo": "git://github.com/user/repo"}}',
		'{"dependencies": {"foo": "git://github.com/user/repo.git"}}',
		// Github: shorthand.
		'{"dependencies": {"foo": "github:user/repo"}}',
		// Gitlab: shorthand.
		'{"dependencies": {"foo": "gitlab:user/repo"}}',
		// Bitbucket: shorthand.
		'{"dependencies": {"foo": "bitbucket:user/repo"}}',
		// Gist: shorthand.
		'{"dependencies": {"foo": "gist:11081aaa281"}}',
		// A URL scheme and a hosted shorthand are both case-insensitive.
		'{"dependencies": {"foo": "GitHub:user/repo"}}',
		'{"dependencies": {"foo": "GIT://github.com/user/repo.git"}}',
		'{"dependencies": {"foo": "GIT+HTTPS://github.com/user/repo"}}',
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
		// `npm-package-arg` decides git from the host and protocol rather than from a suffix, so a hosted URL is a git remote with or without one. These are the shapes no string pattern can reach.
		'{"dependencies": {"foo": "https://github.com/user/repo"}}',
		'{"dependencies": {"foo": "https://gitlab.com/user/repo"}}',
		'{"dependencies": {"foo": "https://gitlab.com/user/repo.GIT"}}',
		'{"dependencies": {"foo": "https://bitbucket.org/user/repo.Git"}}',
		'{"dependencies": {"foo": "ssh://git@github.com/user/repo"}}',
		'{"dependencies": {"foo": "https://user:token@github.com/user/repo"}}',
		// A hosted remote is one whatever the case of the suffix, since the host and the protocol are what npm reads. These are the GitHub HTTPS and scp-style shapes with an uppercase suffix.
		'{"dependencies": {"foo": "https://github.com/user/repo.GIT"}}',
		'{"dependencies": {"foo": "git@github.com:user/repo.GIT"}}',
	],
});
