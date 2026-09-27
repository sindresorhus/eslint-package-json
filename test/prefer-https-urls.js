/* eslint-disable unicorn/prefer-https -- The fixtures intentionally contain http:// URLs to exercise the rule. */
import {getTester} from './utils/test.js';

const {test} = getTester(import.meta);

test.snapshot({
	valid: [
		'{"homepage": "https://example.com"}',
		'{"repository": {"type": "git", "url": "https://github.com/user/repo.git"}}',
		'{"funding": "https://example.com/sponsor"}',
		'{"author": "A <a@b.c> (https://x.com)"}',
		'{"author": "A <http://a@b.c>"}',
		// Npm reads the first `(...)` group, so a later `http://` group is not the url it publishes.
		'{"author": "A <a@b.c> (https://x.com) (http://y.com)"}',
		'{"author": "Foo ()"}',
		// Npm reads `z` out of this one, not the `http://` run that surrounds it.
		'{"author": "Foo (http://y(z))"}',
		'{"homepage": "//example.com"}',
		// A scheme is case-insensitive, so an uppercase one is the same URL npm parses.
		'{"homepage": "HTTPS://example.com"}',
		'{"author": "A (https://x.com) extra"}',
		'{"contributors": ["A <a@b.c> (https://x.com)"]}',
		'{"author": "A"}',
		// A `repository` shorthand is a path to a page, not a URL to rewrite, and an `https://` one is already fine.
		'{"repository": "github:u/r", "homepage": "https://x.com", "author": "A <a@b.c> (https://a.dev)"}',
		// Npm reads a person string with no `(...)` group as the name, so there is no url in it.
		'{"author": "http://x.com"}',
		'{"contributors": ["http://x.com"]}',
		// A person's url is its `url`, or its `web` when `url` is empty, so a `name` is never a url.
		'{"author": {"name": "http://x.com"}}',
		'{"author": {"url": "https://x.com", "web": "http://x.com"}}',
		'{"funding": {"type": "patreon", "name": "http://x.com"}}',
		// A `homepage` is a URL string, never an object with a `url`.
		'{"homepage": {"url": "http://x.com"}}',
	],
	invalid: [
		'{"homepage": "http://example.com"}',
		'{"bugs": "http://example.com/issues"}',
		'{"bugs": {"url": "http://example.com/issues"}}',
		'{"repository": {"type": "git", "url": "http://github.com/user/repo.git"}}',
		'{"funding": "http://example.com/sponsor"}',
		'{"funding": [{"type": "individual", "url": "http://example.com/sponsor"}]}',
		// Plain string element in a `funding` array.
		'{"funding": ["http://example.com/sponsor"]}',
		// Npm publishes a person's `url` in registry metadata exactly as written, so an `http://` one ships just as an `http://` homepage does.
		'{"author": {"name": "A", "url": "http://x.com"}}',
		'{"contributors": [{"name": "A", "url": "http://x.com"}]}',
		'{"maintainers": [{"name": "A", "url": "http://x.com"}]}',
		// Npm parses the url out of the `(...)` group of the person string form and publishes it.
		'{"author": "A <a@b.c> (http://x.com)"}',
		'{"author": "Sindre Sorhus (http://sindresorhus.com)"}',
		'{"contributors": ["A <a@b.c> (http://x.com)"]}',
		'{"contributors": [{"name": "A"}, "B <b@c.d> (http://y.com)"]}',
		'{"maintainers": ["A <a@b.c> (http://x.com)", {"name": "B", "url": "http://y.com"}]}',
		'{"author": "A <a@b.c> (http://x.com)", "homepage": "http://y.com"}',
		'{"author": "Bob (http://a.com) extra"}',
		'{"author": "Bob <a@b.c> (http://a.com) (https://b.com)"}',
		// An empty or nested group is stepped over, and the url npm reads sits inside it.
		'{"author": "Foo () (http://example.com)"}',
		'{"author": "A ((http://x.com))"}',
		'{"author": "Foo (a (http://x.com) b)"}',
		// The fixed url is inserted literally, not as a replacement pattern.
		'{"author": "A (http://x.com/$&)"}',
		// The scheme is case-insensitive, so `HTTP://` is the same insecure scheme.
		'{"homepage": "HTTP://example.com"}',
		'{"bugs": {"url": "HTTP://example.com"}}',
		// Npm reads a person's url as `url || web`.
		'{"author": {"name": "A", "web": "http://a.com"}}',
		'{"maintainers": [{"name": "A", "url": "", "web": "http://a.com"}]}',
	],
});
