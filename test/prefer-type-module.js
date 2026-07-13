import {getTester} from './utils/test.js';

const {test} = getTester(import.meta);

test.snapshot({
	valid: [
		'{"type": "module"}',
		'{"name": "foo", "type": "module"}',
		// Malformed values are handled by validation rules.
		'{"type": true}',
		'{"type": 42}',
		'{"type": "esm"}',
	],
	invalid: [
		'{"name": "foo"}',
		// An empty root has no member to anchor the insertion on.
		'{}',
		'{\n}',
		`{
	"name": "foo"
}`,
		'{"type": "commonjs"}',
	],
});
