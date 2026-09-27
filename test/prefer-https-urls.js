/* eslint-disable unicorn/prefer-https -- The fixtures intentionally contain http:// URLs to exercise the rule. */
import {getTester} from './utils/test.js';

const {test} = getTester(import.meta);

test.snapshot({
	valid: [
		'{"homepage": "https://example.com"}',
		'{"repository": {"type": "git", "url": "https://github.com/user/repo.git"}}',
		'{"funding": "https://example.com/sponsor"}',
		// A `repository` and a `funding` object publish the `url` they carry, so an `http://` `web` or `name`
		// beside an `https://` `url` is a url nobody publishes.
		'{"repository": {"type": "git", "url": "https://x.com", "web": "http://y.com"}}',
		'{"funding": {"url": "https://x.com", "name": "http://y.com"}}',
		// A person in npm's `"Name <email> (url)"` form: npm parses the url out, but it does not start the
		// string, so there is nothing to rewrite in place.
		'{"author": "A <a@b.c> (https://x.com)"}',
		'{"author": "A <http://a@b.c>"}',
		// Npm reads the first `(...)` group, so a later `http://` group is not the url it publishes.
		'{"author": "A <a@b.c> (https://x.com) (http://y.com)"}',
		'{"author": "Foo ()"}',
		// Known gap: the group is located in the raw source, where an escaped paren is not a paren, so
		// the rule takes the outer group and tests its decoded content, which is `(http://x.com)`
		// and not itself a url. Npm reads the inner group, so it publishes an `http://` url
		// this rule leaves alone.
		String.raw`{"author": "A (\u0028http://x.com\u0029)"}`,
		// Npm reads `z` out of this one, not the `http://` run that surrounds it.
		'{"author": "Foo (http://y(z))"}',
		// A `url` the node publishes, so an `http://` `web` beside it is nothing to fix.
		'{"author": {"name": "A", "url": "https://y.com", "web": "http://x.com"}}',
		'{"bugs": {"url": "http://x.com", "web": "https://y.com"}}',
		'{"homepage": "//example.com"}',
		// A scheme is case-insensitive, so an uppercase one is the same URL npm parses.
		'{"homepage": "HTTPS://example.com"}',
		'{"author": "A (https://x.com) extra"}',
		// Npm reads `url || web` off a person object, so an `https://` `web` is nothing to fix.
		'{"author": {"name": "A", "web": "https://x.com"}}',
		'{"contributors": ["A <a@b.c> (https://x.com)"]}',
		'{"author": "A"}',
		// A `repository` shorthand is a path to a page, not a URL to rewrite, and an `https://` one is already fine.
		'{"repository": "github:u/r", "homepage": "https://x.com", "author": "A <a@b.c> (https://a.dev)"}',
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
		// Npm publishes a person's `url` in registry metadata exactly as written, so an `http://` one ships
		// just as an `http://` homepage does.
		'{"author": {"name": "A", "url": "http://x.com"}}',
		'{"author": "http://x.com"}',
		'{"contributors": [{"name": "A", "url": "http://x.com"}]}',
		'{"contributors": ["http://x.com", {"name": "B", "url": "http://y.com"}]}',
		'{"maintainers": [{"name": "A", "url": "http://x.com"}]}',
		'{"funding": [{"url": "http://x.com"}]}',
		// Npm parses the url back out of the person string form and publishes it, so the url is the one to fix
		// even though it does not start the string.
		'{"author": "A <a@b.c> (http://x.com)"}',
		'{"author": "Sindre Sorhus (http://sindresorhus.com)"}',
		'{"contributors": ["A <a@b.c> (http://x.com)"]}',
		'{"contributors": [{"name": "A"}, "B <b@c.d> (http://y.com)"]}',
		'{"maintainers": ["A <a@b.c> (http://x.com)"]}',
		'{"author": "A <a@b.c> (http://x.com)", "homepage": "http://y.com"}',
		// The url is located in the source and decoded on its own, so an escape inside it is neither missed nor
		// spliced over. Every one of these has to leave valid JSON behind.
		String.raw`{"author": "Bob <a@b.c> (http:\/\/a.com\/x)"}`,
		String.raw`{"author": "(http:\/\/b)"}`,
		String.raw`{"contributors": ["Bob (http:\/\/a.com)", "Eve (http:\/\/b.com)"]}`,
		String.raw`{"author": "Bob (http:\/\/a.com) extra"}`,
		'{"author": "Bob <a@b.c> (http://a.com) (https://b.com)"}',
		'{"maintainers": [{"name": "A", "url": "http://x.com"}, "B (http://y.com)"]}',
		'{"author": {"name": "Bob", "web": "http://x.com"}}',
		'{"contributors": [{"name": "Bob", "web": "http://x.com"}]}',
		// Npm copies a `bugs` `web` or `name` over its `url`, so the alias is the one it publishes, and it does
		// the same inside an array. A person object is the other way round: `person.url || person.web`.
		'{"bugs": {"url": "https://good.example", "web": "http://bad.example"}}',
		// An empty `url` hands the field to `web`, so the `web` is what npm publishes.
		'{"author": {"name": "A", "url": "", "web": "http://x.com"}}',
		'{"contributors": [{"name": "A", "url": "", "web": "http://x.com"}]}',
		'{"bugs": {"url": "", "web": "http://x.com"}}',
		// An empty or nested group is stepped over, and the url npm reads sits inside it.
		'{"author": "Foo () (http://example.com)"}',
		'{"author": "A ((http://x.com))"}',
		'{"author": "Foo (a (http://x.com) b)"}',
		'{"contributors": ["Foo () (http://example.com)"]}',
		// The scheme is case-insensitive, so `HTTP://` is the same insecure scheme.
		'{"homepage": "HTTP://example.com"}',
		'{"homepage": "HtTp://example.com"}',
		'{"bugs": {"url": "HTTP://example.com"}}',
		'{"bugs": {"url": "https://good.example", "name": "http://bad.example"}}',
		'{"bugs": [{"url": "https://good.example", "name": "http://bad.example"}]}',
		// A `bugs` object is the one field npm copies a `web` or `name` over its `url`. A `repository` and a
		// `funding` object keep the `url` they carry, so an `http://` one is reported even beside an `https://`
		// alias, and the alias beside it is left alone.
		'{"repository": {"type": "git", "url": "http://x.com", "web": "https://y.com"}}',
		'{"repository": {"type": "git", "url": "http://x.com", "web": "http://y.com"}}',
		'{"funding": {"url": "http://x.com", "name": "https://y.com"}}',
		'{"maintainers": [{"name": "B", "url": "http://x.com"}]}',
	],
});
