import {getTester} from './utils/test.js';

const {test} = getTester(import.meta);

test.snapshot({
	valid: [
		'{"name": "foo", "dependencies": {"bar": "^1.0.0"}}',
		// No name to compare against.
		'{"dependencies": {"foo": "^1.0.0"}}',
		'{"name": "foo"}',
		// Self-hosting: building or linting with the last published release of yourself, as TypeScript and several ESLint plugins do.
		'{"name": "foo", "devDependencies": {"foo": "^1.0.0"}}',
		// A local path is the deliberate self-link that lets a package dogfood its own entry points, which npm resolves to a symlink back at the package.
		'{"name": "foo", "dependencies": {"foo": "file:."}}',
		'{"name": "foo", "dependencies": {"foo": "./"}}',
		// Yarn and pnpm protocols are local links too, and are not ours to second-guess.
		'{"name": "foo", "dependencies": {"foo": "link:."}}',
		'{"name": "foo", "dependencies": {"foo": "workspace:*"}}',
		'{"name": "foo", "dependencies": {"foo": "portal:."}}',
		// An npm alias targeting another package is not a self-dependency.
		'{"name": "foo", "dependencies": {"foo": "npm:bar@^1.0.0"}}',
		// A git or tarball self-reference is an explicit choice, not the accidental registry lookup.
		'{"name": "foo", "dependencies": {"foo": "github:user/foo"}}',
		'{"name": "foo", "dependencies": {"foo": "https://example.com/foo.tgz"}}',
		// A non-string specifier is left to `valid-fields`.
		'{"name": "foo", "dependencies": {"foo": 1}}',
	],
	invalid: [
		'{"name": "foo", "dependencies": {"foo": "^1.0.0"}}',
		'{"name": "foo", "peerDependencies": {"foo": "^1.0.0"}}',
		'{"name": "foo", "optionalDependencies": {"foo": "^1.0.0"}}',
		'{"name": "@scope/foo", "dependencies": {"@scope/foo": "^1.0.0"}}',
		// Removing only the effective member would promote the earlier duplicate into its place.
		'{"name": "foo", "dependencies": {"foo": "^1.0.0", "foo": "^2.0.0"}}',
		// A dist-tag resolves from the registry just like a range does.
		'{"name": "foo", "dependencies": {"foo": "latest"}}',
		'{"name": "foo", "dependencies": {"foo": "1.0.0"}}',
		'{"name": "foo", "dependencies": {"foo": "npm:foo@^1.0.0"}}',
	],
});
