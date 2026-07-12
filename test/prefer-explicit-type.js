import {getTester} from './utils/test.js';

const {test} = getTester(import.meta);

test.snapshot({
	valid: [
		'{"type": "module"}',
		'{"type": "commonjs"}',
		// Invalid values are owned by `valid-fields`.
		'{"type": true}',
		'{"type": "esm"}',
	],
	invalid: [
		'{"name": "foo"}',
		'{}',
	],
});
