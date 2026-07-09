import {getTester} from './utils/test.js';

const {test} = getTester(import.meta);

test.snapshot({
	valid: [
		'{"name": "foo"}',
		'{"bugs": "https://github.com/user/repo/issues"}',
		// Has email, so the object form is needed.
		'{"bugs": {"url": "https://example.com", "email": "bugs@example.com"}}',
		// Has type, so the object form is needed.
		'{"funding": {"type": "individual", "url": "https://example.com"}}',
		// An extra field cannot be encoded in the shorthand, so the object form is kept.
		'{"funding": {"url": "https://github.com/sponsors/user", "platform": "github"}}',
		'{"bugs": {"url": "https://github.com/user/repo/issues", "extra": "x"}}',
		'{"author": "Sindre Sorhus"}',
		// Empty name has no usable shorthand.
		'{"author": {"name": ""}}',
		// Not a github URL, so no safe shorthand.
		'{"repository": {"type": "git", "url": "https://gitlab.com/user/repo.git"}}',
		// `github.com` only as a path segment of another host is not a GitHub URL.
		'{"repository": {"type": "git", "url": "https://example.com/github.com/user/repo"}}',
		// A monorepo `directory` cannot be encoded in the shorthand.
		'{"repository": {"type": "git", "url": "git+https://github.com/user/repo.git", "directory": "packages/foo"}}',
		// An extra person field would be dropped by the string form, so the object is kept.
		'{"author": {"name": "Sindre Sorhus", "twitter": "sindresorhus"}}',
		'{"contributors": [{"name": "Alice", "github": "alice"}]}',
		// An extra repository field would be dropped, so the object is kept.
		'{"repository": {"type": "git", "url": "git+https://github.com/user/repo.git", "branch": "main"}}',
		// A commit-ish fragment cannot round-trip through the bare shorthand.
		'{"repository": {"type": "git", "url": "git+https://github.com/user/repo.git#v1.0.0"}}',
		// A query string cannot round-trip through the bare shorthand.
		'{"repository": {"type": "git", "url": "git+https://github.com/user/repo.git?foo=1"}}',
		// A non-git type has no shorthand.
		'{"repository": {"type": "svn", "url": "https://svn.example.com/repo"}}',
		// A repository object without a `url` has nothing to shorten.
		'{"repository": {"type": "git"}}',
	],
	invalid: [
		'{"bugs": {"url": "https://github.com/user/repo/issues"}}',
		'{"funding": {"url": "https://github.com/sponsors/user"}}',
		'{"author": {"name": "Sindre Sorhus"}}',
		'{"author": {"name": "Sindre Sorhus", "email": "sindre@example.com", "url": "https://sindresorhus.com"}}',
		'{"contributors": [{"name": "Alice"}]}',
		'{"repository": {"type": "git", "url": "git+https://github.com/user/repo.git"}}',
		// No `type` field defaults to git, so the shorthand still applies.
		'{"repository": {"url": "git+https://github.com/user/repo.git"}}',
	],
});
