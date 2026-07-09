import {getTester} from './utils/test.js';

const {test} = getTester(import.meta);

test.snapshot({
	valid: [
		'{"name": "foo", "dependencies": {"bar": "^1.0.0"}}',
		// No name to compare against.
		'{"dependencies": {"foo": "^1.0.0"}}',
		'{"name": "foo"}',
	],
	invalid: [
		'{"name": "foo", "dependencies": {"foo": "^1.0.0"}}',
		'{"name": "foo", "devDependencies": {"foo": "^1.0.0"}}',
		'{"name": "foo", "peerDependencies": {"foo": "^1.0.0"}}',
		'{"name": "foo", "optionalDependencies": {"foo": "^1.0.0"}}',
		'{"name": "@scope/foo", "dependencies": {"@scope/foo": "^1.0.0"}}',
	],
});
