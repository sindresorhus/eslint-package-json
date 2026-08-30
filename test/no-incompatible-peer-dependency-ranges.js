import {getTester} from './utils/test.js';

const {test} = getTester(import.meta);

test.snapshot({
	valid: [
		'{}',
		'"not an object"',
		'{"peerDependencies": {"foo": "^1.0.0"}}',
		'{"dependencies": {"foo": "^1.0.0"}}',
		'{"peerDependencies": {"foo": "^1.0.0"}, "dependencies": {"foo": ">=1.5.0 <2.0.0"}}',
		'{"peerDependencies": {"foo": "^1.0.0 || ^3.0.0"}, "dependencies": {"foo": "^3.1.0"}}',
		'{"peerDependencies": {"foo": "1.x"}, "optionalDependencies": {"foo": "1.2.3"}}',
		'{"peerDependencies": {"foo": "*"}, "dependencies": {"foo": "^9.0.0"}}',
		// Ranges that explicitly mention prerelease versions are not compared.
		'{"peerDependencies": {"foo": "^1.0.0-beta.1"}, "dependencies": {"foo": ">=1.0.0-beta.2 <1.0.0"}}',
		'{"peerDependencies": {"foo": "^1.0.0"}, "dependencies": {"foo": ">=1.1.0-beta.1 <1.2.0"}}',
		'{"peerDependencies": {"foo": ">=1.0.0-beta.1 <1.0.0-beta.3"}, "dependencies": {"foo": ">=1.0.0-rc.0 <1.0.0"}}',
		'{"peerDependencies": {"foo": "^1.0.0"}, "dependencies": {"foo": ">=1.1.0-beta.1 <1.1.0"}}',
		'{"peerDependencies": {"foo": "^1.0.0"}, "dependencies": {"foo": ">=1.1.0-- <1.1.0"}}',
		'{"peerDependencies": {"foo": ">1.2.3 <1.2.4-alpha"}, "dependencies": {"foo": ">=1.2.4-0"}}',
		// `devDependencies` compatibility belongs to `peer-dependencies-as-dev-dependencies`.
		'{"peerDependencies": {"foo": "^1.0.0"}, "devDependencies": {"foo": "^2.0.0"}}',
		// Non-semver specifiers cannot be compared.
		'{"peerDependencies": {"foo": "workspace:*"}, "dependencies": {"foo": "^1.0.0"}}',
		'{"peerDependencies": {"foo": "^1.0.0"}, "dependencies": {"foo": "latest"}}',
		'{"peerDependencies": {"foo": "^1.0.0"}, "dependencies": {"foo": "file:../foo"}}',
		'{"peerDependencies": {"foo": "^1.0.0"}, "dependencies": {"foo": "github:user/repo"}}',
		// Malformed fields are left to `valid-fields`.
		'{"peerDependencies": {"foo": 1}, "dependencies": {"foo": "^2.0.0"}}',
		'{"peerDependencies": {"foo": "^1.0.0"}, "dependencies": {"foo": 2}}',
		'{"peerDependencies": [], "dependencies": {"foo": "^2.0.0"}}',
		'{"peerDependencies": {"foo": "^1.0.0"}, "dependencies": []}',
		// Effective duplicate keys overlap; shadowed ranges do not affect the manifest's meaning.
		'{"peerDependencies": {"foo": "^2.0.0", "foo": "^1.0.0"}, "dependencies": {"foo": "^1.5.0"}}',
		'{"peerDependencies": {"foo": "^1.0.0"}, "dependencies": {"foo": "^2.0.0", "foo": "^1.5.0"}}',
		'{"peerDependencies": {"foo": "^2.0.0"}, "peerDependencies": {"foo": "^1.0.0"}, "dependencies": {"foo": "^1.5.0"}}',
	],
	invalid: [
		'{"peerDependencies": {"foo": "^1.0.0"}, "dependencies": {"foo": "^2.0.0"}}',
		'{"peerDependencies": {"foo": "^1.0.0 || ^3.0.0"}, "dependencies": {"foo": "^2.0.0"}}',
		'{"peerDependencies": {"foo": "^1.0.0"}, "optionalDependencies": {"foo": "^2.0.0"}}',
		'{"peerDependencies": {"foo": "1.2.3"}, "dependencies": {"foo": "1.2.4"}}',
		'{"peerDependencies": {"foo": "1.0.0 - 2.0.0"}, "dependencies": {"foo": "^3.0.0"}}',
		'{"peerDependencies": {"foo": "1.0.0+1.2.3-alpha"}, "dependencies": {"foo": "2.0.0"}}',
		'{"peerDependencies": {"foo": ">2.0.0 <1.0.0"}, "dependencies": {"foo": "*"}}',
		'{"peerDependencies": {"foo": "*"}, "dependencies": {"foo": ">2.0.0 <1.0.0"}}',
		// Optional peers are still incompatible when an explicitly installed optional dependency cannot satisfy their range.
		'{"peerDependencies": {"foo": "^1.0.0"}, "peerDependenciesMeta": {"foo": {"optional": true}}, "optionalDependencies": {"foo": "^2.0.0"}}',
		// Final duplicate keys determine both effective ranges.
		'{"peerDependencies": {"foo": "^2.0.0", "foo": "^1.0.0"}, "dependencies": {"foo": "^1.5.0", "foo": "^2.0.0"}}',
		'{"peerDependencies": {"foo": "^1.0.0"}, "dependencies": {"foo": "^1.5.0"}, "dependencies": {"foo": "^2.0.0"}}',
		'{"peerDependencies": {"foo": "^1.0.0", "bar": "^3.0.0"}, "dependencies": {"foo": "^2.0.0"}, "optionalDependencies": {"bar": "^4.0.0"}}',
	],
});
