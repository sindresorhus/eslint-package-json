/* eslint-disable unicorn/prefer-https -- The fixtures intentionally contain http:// URLs to exercise the rule. */
import {getTester} from './utils/test.js';

const {test} = getTester(import.meta);

test.snapshot({
	valid: [
		'{"homepage": "https://example.com"}',
		'{"repository": {"type": "git", "url": "https://github.com/user/repo.git"}}',
		'{"funding": "https://example.com/sponsor"}',
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
	],
});
