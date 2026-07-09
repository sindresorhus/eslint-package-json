import {getTester} from './utils/test.js';

const {test} = getTester(import.meta);

test.snapshot({
	valid: [
		'{"dependencies": {"lodash": "^4.0.0"}}',
		'{"dependencies": {"my-path-utils": "^1.0.0"}}',
		// Ignored built-in name.
		{
			code: '{"dependencies": {"events": "^3.0.0"}}',
			options: [{ignore: ['events']}],
		},
	],
	invalid: [
		'{"dependencies": {"path": "^0.12.7"}}',
		'{"dependencies": {"fs": "0.0.2"}}',
		'{"devDependencies": {"crypto": "^1.0.0"}}',
		'{"dependencies": {"path": "^0.12.7", "util": "^0.12.0"}}',
	],
});
