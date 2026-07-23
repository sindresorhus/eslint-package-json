import {getTester} from './utils/test.js';

const {test} = getTester(import.meta);

test.snapshot({
	valid: [
		// Peer dep also in devDependencies.
		'{"peerDependencies": {"foo": "^1.0.0"}, "devDependencies": {"foo": "^1.0.0"}}',
		// Multiple peer deps all in devDependencies.
		'{"peerDependencies": {"foo": "^1.0.0", "bar": "^2.0.0"}, "devDependencies": {"foo": "^1.0.0", "bar": "^2.0.0"}}',
		// No peerDependencies field.
		'{"dependencies": {"foo": "^1.0.0"}}',
		// Empty peerDependencies.
		'{"peerDependencies": {}}',
		// No devDependencies but also no peerDependencies.
		'{"name": "my-package"}',
		// PeerDependencies value is not an object (edge case).
		'{"peerDependencies": "invalid"}',
		// Dev version differs but still satisfies the peer range.
		'{"peerDependencies": {"foo": "^1.0.0"}, "devDependencies": {"foo": "1.5.0"}}',
		// Non-range dev specifier is skipped.
		'{"peerDependencies": {"foo": "^1.0.0"}, "devDependencies": {"foo": "workspace:*"}}',
		// A non-string peer value present in devDependencies is skipped.
		'{"peerDependencies": {"foo": 1}, "devDependencies": {"foo": "^1.0.0"}}',
		// A non-string peer value missing from devDependencies is malformed and skipped (reported by `valid-fields`).
		'{"peerDependencies": {"foo": 1}}',
		// A non-string devDependencies range is malformed, so the overlap check is skipped rather than crashing.
		'{"peerDependencies": {"foo": "^1.0.0"}, "devDependencies": {"foo": 123}}',
		// An optional peer is exempt from the missing-devDependencies check.
		'{"peerDependencies": {"foo": "^1.0.0"}, "peerDependenciesMeta": {"foo": {"optional": true}}}',
		// A duplicated peer key resolves to its final range, which matches the devDependency; the shadowed earlier range must not raise a spurious mismatch.
		'{"peerDependencies": {"foo": "^1.0.0", "foo": "^2.0.0"}, "devDependencies": {"foo": "^2.0.0"}}',
	],
	invalid: [
		// A non-object `peerDependenciesMeta` entry must not break the optional-peer lookup.
		'{"peerDependencies": {"a": "^1.0.0"}, "peerDependenciesMeta": {"a": []}}',
		'{"peerDependencies": {"a": "^1.0.0"}, "peerDependenciesMeta": {"a": "x"}}',
		'{"peerDependencies": {"a": "^1.0.0"}, "peerDependenciesMeta": {"a": null}}',
		// Peer dep not in devDependencies.
		'{"peerDependencies": {"foo": "^1.0.0"}}',
		// Peer dep not in devDependencies (devDependencies exists but doesn't have it).
		'{"peerDependencies": {"foo": "^1.0.0"}, "devDependencies": {"bar": "^2.0.0"}}',
		// Multiple peer deps, none in devDependencies.
		'{"peerDependencies": {"foo": "^1.0.0", "bar": "^2.0.0"}}',
		// Multiple peer deps, only some in devDependencies.
		'{"peerDependencies": {"foo": "^1.0.0", "bar": "^2.0.0"}, "devDependencies": {"foo": "^1.0.0"}}',
		// No devDependencies at all.
		'{"peerDependencies": {"react": "^18.0.0"}}',
		// Empty devDependencies object: the added entry fills it.
		'{"peerDependencies": {"foo": "^1.0.0"}, "devDependencies": {}}',
		// Multiline input: the added entry preserves the file's indentation.
		`{
	"peerDependencies": {
		"foo": "^1.0.0"
	},
	"devDependencies": {
		"bar": "^2.0.0"
	}
}`,
		// Dev version does not satisfy the peer range.
		'{"peerDependencies": {"react": "^18.0.0"}, "devDependencies": {"react": "^17.0.0"}}',
		// A malformed (non-object) `devDependencies` is left to `valid-fields`; no fix is offered.
		'{"peerDependencies": {"foo": "^1.0.0"}, "devDependencies": "invalid"}',
		// `optional: false` is not exempt from the missing-devDependencies check.
		'{"peerDependencies": {"foo": "^1.0.0"}, "peerDependenciesMeta": {"foo": {"optional": false}}}',
		// A duplicated meta key resolves to its final entry: the effective `optional: false` makes the peer required, so a shadowed `optional: true` must not exempt it.
		'{"peerDependencies": {"foo": "^1.0.0"}, "peerDependenciesMeta": {"foo": {"optional": true}, "foo": {"optional": false}}}',
		// An optional peer that is in devDependencies still has its range checked against the peer range.
		'{"peerDependencies": {"react": "^18.0.0"}, "peerDependenciesMeta": {"react": {"optional": true}}, "devDependencies": {"react": "^17.0.0"}}',
	],
});
