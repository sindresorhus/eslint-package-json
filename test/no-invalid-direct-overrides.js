import {getTester} from './utils/test.js';

const {test} = getTester(import.meta);

test.snapshot({
	valid: [
		'{}',
		'"not an object"',
		'{"dependencies": {"foo": "^1.0.0"}}',
		'{"dependencies": {"foo": "^1.0.0"}, "overrides": {"bar": "^2.0.0"}}',
		'{"dependencies": {"foo": "^1.0.0"}, "overrides": {"foo": "^1.0.0"}}',
		'{"dependencies": {"foo": "^1.0.0"}, "overrides": {"foo": {".": "^1.0.0", "bar": "^2.0.0"}}}',
		'{"dependencies": {"foo": "^1.0.0"}, "overrides": {"foo": "$foo"}}',
		'{"dependencies": {"foo": "^1.0.0", "bar": "^1.0.0"}, "overrides": {"foo": "$bar"}}',
		'{"dependencies": {"foo": "^1.0.0"}, "overrides": {"foo": ""}}',
		'{"dependencies": {"foo": "^1.0.0"}, "overrides": {"foo": "*"}}',
		'{"dependencies": {"foo": "^1.0.0"}, "overrides": {"foo": {"bar": "^2.0.0"}}}',
		'{"dependencies": {"foo": "^1.0.0"}, "overrides": {"foo@^2.0.0": "^2.0.0"}}',
		'{"dependencies": {"foo": "^1.0.0"}, "overrides": {"foo@^1.0.0": "^1.0.0"}}',
		'{"dependencies": {"foo": "^1.2.3"}, "overrides": {"foo@^1.0.0": "^1.2.3", "foo@~1.2.0": "^2.0.0"}}',
		'{"devDependencies": {"foo": "^1.0.0"}, "overrides": {"foo": "^1.0.0"}}',
		'{"optionalDependencies": {"foo": "^1.0.0"}, "overrides": {"foo": "^1.0.0"}}',
		'{"peerDependencies": {"foo": "^1.0.0"}, "overrides": {"foo": "^1.0.0"}}',
		// Invalid fields are left to `valid-fields`.
		'{"dependencies": {"foo": 1}, "overrides": {"foo": "^2.0.0"}}',
		'{"dependencies": {"foo": "^1.0.0"}, "overrides": []}',
		'{"dependencies": {"foo": "^1.0.0"}, "overrides": {"foo": {".": 1}}}',
	],
	invalid: [
		'{"dependencies": {"foo": "^1.0.0"}, "overrides": {"foo": "^2.0.0"}}',
		'{"devDependencies": {"foo": "^1.0.0"}, "overrides": {"foo": "^2.0.0"}}',
		'{"optionalDependencies": {"foo": "^1.0.0"}, "overrides": {"foo": "^2.0.0"}}',
		'{"peerDependencies": {"foo": "^1.0.0"}, "overrides": {"foo": "^2.0.0"}}',
		'{"dependencies": {"foo": "^1.0.0", "bar": "^2.0.0"}, "overrides": {"foo": "$bar"}}',
		'{"dependencies": {"@scope/foo": "^1.0.0"}, "overrides": {"@scope/foo": "^2.0.0"}}',
		'{"dependencies": {"foo": "^1.2.3"}, "overrides": {"foo@^1.0.0": {"bar": "^2.0.0"}}}',
		'{"dependencies": {"foo": "^1.0.0"}, "devDependencies": {"foo": "^2.0.0"}, "overrides": {"foo": "^1.0.0"}}',
		'{"dependencies": {"foo": "latest"}, "overrides": {"foo": "next"}}',
		'{"dependencies": {"foo": "latest"}, "overrides": {"foo@next": "beta"}}',
		'{"dependencies": {"foo": "file:../foo"}, "overrides": {"foo@file:../bar": "file:../baz"}}',
		'{"dependencies": {"foo": "../foo"}, "overrides": {"foo@../bar": "../baz"}}',
		'{"dependencies": {"foo": "https://example.com/foo.tgz"}, "overrides": {"foo@https://example.com/bar.tgz": "https://example.com/baz.tgz"}}',
		'{"dependencies": {"foo": "^1.2.3"}, "overrides": {"foo@^1.0.0": "^2.0.0", "foo@~1.2.0": "^1.2.3"}}',
		'{\n\t"dependencies": {\n\t\t"foo": "^1.2.3"\n\t},\n\t"overrides": {\n\t\t"foo@^1.0.0": {\n\t\t\t"bar": "^2.0.0"\n\t\t}\n\t}\n}',
	],
});
