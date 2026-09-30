import {getTester} from './utils/test.js';

const {test} = getTester(import.meta);

test.snapshot({
	valid: [
		// `npm-package-arg` parses a specifier with semver's loose grammar, so a leading zero in a numeric part and a leading zero in a prerelease identifier are versions to it rather than tags.
		'{"dependencies": {"foo": "1.0.0-01"}}',
		'{"dependencies": {"foo": "01.2.3"}}',
		'{"dependencies": {"foo": "1.0.0-"}}',
		'{"dependencies": {"foo": "npm:bar@1.0.0-01"}}',
		// A path and a protocol are not tags either, and `npm-package-arg` refuses the yarn and pnpm ones.
		'{"dependencies": {"foo": "portal:../foo"}}',
		'{"dependencies": {"foo": "link:../foo"}}',

		'{"dependencies": {"foo": "^1.0.0"}}',
		'{"dependencies": {"foo": "1.2.x"}}',
		// Wildcards are handled by `no-wildcard-dependencies`.
		'{"dependencies": {"foo": "*"}}',
		// Protocols and shorthands are not dist-tags.
		'{"dependencies": {"foo": "workspace:*"}}',
		'{"dependencies": {"foo": "file:../foo"}}',
		'{"dependencies": {"foo": "github:user/repo"}}',
		'{"dependencies": {"foo": "npm:bar@^1.0.0"}}',
		'{"dependencies": {"foo": "npm:bar@1.0.0"}}',
		'{"dependencies": {"foo": "npm:bar"}}',
		'{"dependencies": {"foo": "npm:"}}',
		'{"dependencies": {"foo": "NPM:bar@^1.0.0"}}',
		// A leading `.` is a relative directory path to npm, not a tag.
		'{"dependencies": {"foo": "."}}',
		'{"dependencies": {"foo": ".."}}',
		'{"dependencies": {"foo": ".foo"}}',
		'{"dependencies": {"foo": "..bar"}}',
		'{"devDependencies": {"foo": ".hidden"}}',
		// A non-string value is malformed and left to other rules, not passed to semver.
		'{"dependencies": {"foo": 123}}',
		// An alias with no version at all carries no dist-tag, whatever the scheme casing.
		'{"dependencies": {"foo": "NPM:bar"}}',
		'{"dependencies": {"a": ".foo", "b": "v1.2.3"}}',
		'{"dependencies": {"a": "npm:@scope/bar@2", "b": "npm:bar@file:../x"}}',
	],
	invalid: [
		'{"dependencies": {"foo": "latest"}}',
		'{"dependencies": {"foo": "next"}}',
		'{"devDependencies": {"foo": "beta"}}',
		// An `npm:` alias carries its own specifier, and a dist-tag there is just as unpinned.
		'{"dependencies": {"foo": "npm:bar@next"}}',
		'{"dependencies": {"foo": "npm:@scope/bar@latest"}}',
		'{"devDependencies": {"foo": "npm:bar@canary"}}',
		// A URL scheme is case-insensitive (RFC 3986) and `npm-package-arg` resolves an uppercase alias to the same dist-tag, so the scheme is matched case-insensitively here too.
		'{"dependencies": {"foo": "NPM:bar@next"}}',
		'{"dependencies": {"foo": "Npm:@scope/bar@latest"}}',
	],
});
