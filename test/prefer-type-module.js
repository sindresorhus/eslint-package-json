import {getTester} from './utils/test.js';

const {test} = getTester(import.meta);

test.snapshot({
	valid: [
		'{"type": "module"}',
		'{"name": "foo", "type": "module"}',
		// A non-string `type` is malformed; `valid-fields` owns that, not this rule.
		'{"type": true}',
		'{"type": 42}',
	],
	invalid: [
		'{"name": "foo"}',
		'{"type": "commonjs"}',
		'{"type": "esm"}',
		// An empty root has no member to anchor the insertion on.
		'{}',
	],
});
