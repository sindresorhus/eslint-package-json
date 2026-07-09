import {getTester} from './utils/test.js';

const {test} = getTester(import.meta);

test.snapshot({
	valid: [
		'{"peerDependencies": {"react": "^18.2.0"}}',
		'{"peerDependencies": {"react": ">=18"}}',
		'{"peerDependencies": {"react": "*"}}',
		'{"peerDependencies": {"react": "17 || 18"}}',
		'{"peerDependencies": {"react": "workspace:*"}}',
		// A `=`-prefixed version is treated as a range, not an exact pin.
		'{"peerDependencies": {"react": "=1.0.0"}}',
		// Non-string value.
		'{"peerDependencies": {"react": 18}}',
		// No `peerDependencies`.
		'{"dependencies": {"react": "18.2.0"}}',
	],
	invalid: [
		'{"peerDependencies": {"react": "18.2.0"}}',
		'{"peerDependencies": {"react": "2.0.0-beta.1"}}',
		`{
			"peerDependencies": {
				"react": "18.2.0",
				"vue": "^3.0.0"
			}
		}`,
	],
});
