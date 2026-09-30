/* eslint-disable unicorn/prefer-https -- The fixtures intentionally contain http:// URLs to exercise the rule. */
import {getTester} from './utils/test.js';

const {test} = getTester(import.meta);

test.snapshot({
	valid: [
		'{"dependencies": {"foo": "^1.0.0"}}',
		// Git URLs are handled by `no-git-dependencies`. Npm resolves these from the host, so they are git remotes with or without a `git+` prefix and a `.git` suffix.
		'{"dependencies": {"foo": "git+https://github.com/user/repo.git"}}',
		'{"dependencies": {"foo": "https://github.com/user/repo.git"}}',
		'{"dependencies": {"foo": "https://github.com/user/repo"}}',
		'{"dependencies": {"foo": "https://gitlab.com/user/repo.GIT"}}',
		// A non-string value is ignored.
		'{"dependencies": {"foo": 123}}',
	],
	invalid: [
		'{"dependencies": {"foo": "https://example.com/foo.tgz"}}',
		'{"devDependencies": {"foo": "http://example.com/foo.tar.gz"}}',
		// A URL scheme is case-insensitive, and npm fetches these as remote tarballs.
		'{"dependencies": {"foo": "HTTPS://example.com/foo.tgz"}}',
		'{"dependencies": {"foo": "Http://example.com/foo.tgz"}}',
		// The host decides, not the suffix. An unhosted URL is a tarball whatever its casing, and it is not a git remote, so `no-git-dependencies` leaves it and this rule still reports it.
		'{"dependencies": {"foo": "https://example.com/foo.GIT"}}',
		'{"dependencies": {"foo": "https://example.com/foo.git"}}',
		'{"dependencies": {"foo": "https://example.com/foo.git#v1"}}',
	],
});
