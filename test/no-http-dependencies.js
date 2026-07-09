/* eslint-disable unicorn/prefer-https -- The fixtures intentionally contain http:// URLs to exercise the rule. */
import {getTester} from './utils/test.js';

const {test} = getTester(import.meta);

test.snapshot({
	valid: [
		'{"dependencies": {"foo": "^1.0.0"}}',
		// Git URLs are handled by `no-git-dependencies`.
		'{"dependencies": {"foo": "git+https://github.com/user/repo.git"}}',
		'{"dependencies": {"foo": "https://github.com/user/repo.git"}}',
		// A non-string value is ignored.
		'{"dependencies": {"foo": 123}}',
	],
	invalid: [
		'{"dependencies": {"foo": "https://example.com/foo.tgz"}}',
		'{"devDependencies": {"foo": "http://example.com/foo.tar.gz"}}',
	],
});
