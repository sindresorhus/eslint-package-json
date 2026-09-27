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
		'{"dependencies": {"foo": "github:user/repo/subdirectory"}}',
		// A bare `owner/repo` is the hosted shorthand, not a path; `no-git-dependencies` reports it.
		'{"dependencies": {"foo": "user/repo"}}',
		'{"dependencies": {"foo": "user/repo#main"}}',
		'{"dependencies": {"foo": "packages/utils"}}',
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
		// The committish of the hosted `owner/repo` shorthand may hold slashes of its own. `npm-package-arg` still reads these as git.
		'{"dependencies": {"foo": "user/repo#feature/login"}}',
		'{"dependencies": {"foo": "user/repo#path:packages/foo"}}',
		// A `~` without a slash is a range, not the home directory.
		'{"dependencies": {"foo": "~1.2.3"}}',
		// Protocols `npm-package-arg` does not know are not local.
		'{"dependencies": {"foo": "catalog:"}}',
		// A tarball URL is remote, not local. `no-http-dependencies` owns it.
		'{"dependencies": {"foo": "https://example.com/foo.tgz"}}',
	],
	invalid: [
		// File: protocol.
		'{"dependencies": {"foo": "file:../foo"}}',
		// Link: protocol.
		'{"dependencies": {"foo": "link:../foo"}}',
		// Relative paths.
		'{"dependencies": {"foo": "./foo"}}',
		'{"dependencies": {"foo": "../foo"}}',
		// The bare relative directory forms carry no slash.
		'{"dependencies": {"foo": "."}}',
		'{"dependencies": {"foo": ".."}}',
		'{"peerDependencies": {"foo": "."}}',
		// Windows drive path.
		'{"dependencies": {"foo": "C:/foo"}}',
		String.raw`{"dependencies": {"foo": "C:\\foo"}}`,
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
		// `portal:` is Yarn Berry's sibling of `link:` and names a local directory just the same.
		'{"dependencies": {"foo": "portal:../foo"}}',
		'{"dependencies": {"foo": "portal:."}}',
		// A bare specifier is a directory npm copies into `node_modules` as soon as it is three path segments
		// or ends in a slash, because `npm-package-arg` reads a one- or two-segment one as the hosted
		// `owner/repo` shorthand instead. Verified against `npm-package-arg`.
		'{"dependencies": {"foo": "packages/utils/"}}',
		'{"dependencies": {"foo": "a/b/c"}}',
		'{"dependencies": {"foo": "a/b/c/d"}}',
		'{"dependencies": {"foo": "a/"}}',
		'{"dependencies": {"foo": "x/"}}',
		'{"peerDependencies": {"foo": "packages/utils/"}}',
		'{"dependencies": {"foo": "@scope/a/b"}}',
		'{"dependencies": {"a": "~/x", "b": "/abs", "c": "C:/x"}}',
		// `npm-package-arg` reads the `file:` scheme case-insensitively.
		'{"dependencies": {"foo": "FILE:../foo", "bar": "File:."}}',
		// A bare tarball name is a local file.
		'{"dependencies": {"foo": "foo.tgz", "bar": "foo-1.0.0.tar.gz"}}',
		// A drive letter without a slash is a drive-relative directory.
		'{"dependencies": {"foo": "C:foo"}}',
		// A scoped name in the value position is a two-segment path, which `npm-package-arg` reads as a directory rather than the hosted shorthand.
		'{"dependencies": {"foo": "@scope/a"}}',
	],
});
