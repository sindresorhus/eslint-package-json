import {getTester} from './utils/test.js';

const {test} = getTester(import.meta);

test.snapshot({
	valid: [
		'{"type": "module"}',
		'{"name": "foo", "type": "module"}',
		// A missing `type` is allowed, while malformed values are handled by `valid-fields`.
		'{"name": "foo"}',
		'{"type": true}',
		'{"type": 42}',
		'{"type": "esm"}',
	],
	invalid: [
		'{"type": "commonjs"}',
	],
});
