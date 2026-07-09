import {getTester} from './utils/test.js';

const {test} = getTester(import.meta);

test.snapshot({
	valid: [
		// No repository field.
		'{"bugs": "https://github.com/foo/bar/issues"}',
		// Non-hosted (self-hosted/unrecognized) git URL: nothing is inferred, so nothing is redundant.
		'{"repository": "git+https://git.example.com/foo/bar.git", "bugs": "https://git.example.com/foo/bar/issues"}',
		// Malformed repository (left to `valid-fields`).
		'{"repository": 1, "bugs": "https://github.com/foo/bar/issues"}',
		'{"repository": {}, "bugs": "https://github.com/foo/bar/issues"}',
		// A `directory` value scopes bugs/homepage to a subpackage, which npm's inference does not account for.
		'{"repository": {"url": "https://github.com/foo/bar", "directory": "packages/baz"}, "bugs": "https://github.com/foo/bar/issues"}',
		// A custom bugs URL that differs from the inferred one.
		'{"repository": "foo/bar", "bugs": "https://example.com/support"}',
		// A custom homepage that differs from the inferred one.
		'{"repository": "foo/bar", "homepage": "https://example.com"}',
		// A `bugs` object with an `email` too is not fully redundant; removing the field would drop the email.
		'{"repository": "foo/bar", "bugs": {"url": "https://github.com/foo/bar/issues", "email": "support@example.com"}}',
		// No bugs/homepage fields at all.
		'{"repository": "foo/bar"}',
		// Sourcehut does not infer a bugs URL at all, so an explicit one is never redundant.
		'{"repository": "https://git.sr.ht/~foo/bar", "bugs": "https://git.sr.ht/~foo/bar/issues"}',
	],
	invalid: [
		// GitHub shorthand.
		'{"repository": "foo/bar", "bugs": "https://github.com/foo/bar/issues"}',
		'{"repository": "foo/bar", "homepage": "https://github.com/foo/bar#readme"}',
		'{"repository": "foo/bar", "bugs": "https://github.com/foo/bar/issues", "homepage": "https://github.com/foo/bar#readme"}',
		// `bugs` as a redundant `{url}`-only object.
		'{"repository": "foo/bar", "bugs": {"url": "https://github.com/foo/bar/issues"}}',
		// Full git URL form.
		'{"repository": {"url": "git+https://github.com/foo/bar.git"}, "bugs": "https://github.com/foo/bar/issues"}',
		// GitLab.
		'{"repository": "gitlab:foo/bar", "bugs": "https://gitlab.com/foo/bar/issues"}',
		// Bitbucket.
		'{"repository": "bitbucket:foo/bar", "bugs": "https://bitbucket.org/foo/bar/issues"}',
		// Gist (no `/issues` suffix, no `#readme` suffix).
		'{"repository": "gist:abc123", "bugs": "https://gist.github.com/abc123", "homepage": "https://gist.github.com/abc123"}',
		// Sourcehut still infers a homepage even though it does not infer bugs.
		'{"repository": "https://git.sr.ht/~foo/bar", "homepage": "https://git.sr.ht/~foo/bar#readme"}',
	],
});
