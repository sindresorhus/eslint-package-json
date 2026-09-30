/* eslint-disable unicorn/prefer-https -- The fixtures intentionally contain http:// URLs to exercise the rule. */
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
		// The string form delimits the email with `<>` and the url with `()`, so a value containing either would be re-parsed into a different field.
		'{"author": {"name": "Foo (Bar)", "email": "foo@example.com"}}',
		'{"author": {"name": "A <b> C"}}',
		'{"author": {"name": "Company (Div), Inc."}}',
		'{"author": {"name": "Ada", "url": "https://example.com/a(b)"}}',
		'{"author": {"name": "Ada", "email": "a<b>@example.com"}}',
		'{"contributors": [{"name": "Alice (Bob)"}]}',
		// Anything past the repository name names a ref, a file, or the issue tracker, none of which the bare `github:user/repo` shorthand carries.
		'{"repository": {"type": "git", "url": "https://github.com/user/repo/tree/v1.2.3"}}',
		'{"repository": {"type": "git", "url": "https://github.com/user/repo/blob/main/src/index.js"}}',
		// A carried field whose value is not a string is dropped by the shorthand, and no other rule reports it.
		'{"author": {"name": "Sindre Sorhus", "email": 123}}',
		'{"author": {"name": "Sindre Sorhus", "url": {"href": "https://sindresorhus.com"}}}',
		'{"contributors": [{"name": "Alice", "email": null}]}',
		// A trailing slash after the repository name is still just the repository.
		'{"repository": {"type": "git", "url": "https://github.com/user/repo/tree/"}}',
		// `github.com` has to be the host, not a path segment on someone else's host, or the shorthand would repoint the package at a different repository.
		'{"repository": {"type": "git", "url": "https://gitlab.com/@github.com/u/r"}}',
		'{"repository": {"type": "git", "url": "https://example.com/@github.com/user/repo"}}',
		'{"repository": {"type": "git", "url": "https://notgithub.com/u/r"}}',
		'{"repository": {"type": "git", "url": "https://github.com.evil.com/u/r"}}',
		// Npm strips exactly one trailing `.git`, so `github:user/repo.git` is the repository `user/repo` and a repository literally named `repo.git` has no shorthand that round-trips.
		'{"repository": {"type": "git", "url": "https://github.com/user/repo.git.git"}}',
		// `github:user/repo` always publishes as `git+https://github.com/user/repo.git`, so only a credential-free `https` URL is the same repository afterwards. An ssh or SCP URL would switch transport and userinfo would be deleted outright.
		'{"repository": {"type": "git", "url": "git@github.com:user/repo.git"}}',
		'{"repository": {"type": "git", "url": "git+ssh://git@github.com/user/repo.git"}}',
		'{"repository": {"type": "git", "url": "ssh://git@github.com/user/repo.git"}}',
		'{"repository": {"type": "git", "url": "https://tok:secret@github.com/user/repo.git"}}',
		'{"repository": {"type": "git", "url": "https://tok@github.com/user/repo.git"}}',
		'{"repository": {"type": "git", "url": "http://github.com/user/repo.git"}}',
		// Npm re-reads a `bugs` string holding an `@` before a later `.` as `bugs.email`, so the shorthand would flip the key's meaning. This is npm's own test.
		'{"bugs": {"url": "https://user@github.com/user/repo"}}',
		'{"bugs": {"url": "https://a.b@c.d/x"}}',
		'{"bugs": {"url": "mailto:user@example.com"}}',
		// An empty `url` would become an empty field, which `no-empty-fields` then reports.
		'{"bugs": {"url": ""}}',
		'{"funding": {"url": ""}}',
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
		// A key repeated with a different value is still one field, and the final one wins.
		`{
	"bugs": {
		"url": "https://example.com/old",
		"url": "https://github.com/user/repo/issues"
	}
}`,
		// Npm resolves a trailing slash after the repository name, so the shorthand is exact.
		'{"repository": {"type": "git", "url": "git+https://github.com/user/repo/"}}',
		// A duplicated `name` key is one field, and the final value wins.
		'{"author": {"name": "A", "name": "B"}}',
		// `funding` is not re-read that way, so only `bugs` is guarded.
		'{"funding": {"url": "https://user@github.com/user"}}',
		// Only the lowercase suffix is the one npm strips, so `repo.GIT.git` is the repository `repo.GIT` and the shorthand that names it is exact.
		'{"repository": {"type": "git", "url": "https://github.com/user/repo.GIT.git"}}',
		// A suffix in any other case is not npm's to strip, so the repository keeps it and the shorthand has to carry it: `github:user/repo` would name a different repository.
		'{"repository": {"type": "git", "url": "https://github.com/user/repo.GIT"}}',
		'{"repository": {"type": "git", "url": "https://github.com/user/repo.Git"}}',
	],
});
