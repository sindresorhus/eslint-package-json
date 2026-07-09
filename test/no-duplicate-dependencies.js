import {getTester} from './utils/test.js';

const {test} = getTester(import.meta);

test.snapshot({
	valid: [
		'{"dependencies": {"a": "1.0.0"}, "devDependencies": {"b": "1.0.0"}}',
		// Peer + dev overlap is allowed.
		'{"peerDependencies": {"a": "1.0.0"}, "devDependencies": {"a": "1.0.0"}}',
		'{"dependencies": {"a": "1.0.0"}}',
	],
	invalid: [
		'{"dependencies": {"a": "1.0.0"}, "devDependencies": {"a": "1.0.0"}}',
		'{"dependencies": {"a": "1.0.0"}, "optionalDependencies": {"a": "1.0.0"}}',
		'{"dependencies": {"a": "1.0.0", "b": "1.0.0"}, "devDependencies": {"b": "2.0.0"}}',
		// Same package across three groups is reported for each later group.
		'{"dependencies": {"a": "1.0.0"}, "devDependencies": {"a": "1.0.0"}, "optionalDependencies": {"a": "1.0.0"}}',
	],
});
