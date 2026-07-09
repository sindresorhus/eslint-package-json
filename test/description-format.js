import {getTester} from './utils/test.js';

const {test} = getTester(import.meta);

test.snapshot({
	valid: [
		// Default: startWithUppercase=true, endWithPeriod=false
		'{"description": "My package does things"}',
		'{"description": "Validates JSON schemas"}',
		// No description field is out of scope.
		'{"name": "foo"}',
		// Non-string description is out of scope.
		'{"description": 123}',
		// Empty string is out of scope.
		'{"description": ""}',
		// Starts with uppercase and no trailing period — passes defaults.
		'{"description": "Some tool"}',
		// EndWithPeriod=true, already ends with period.
		{
			code: '{"description": "Does things."}',
			options: [{endWithPeriod: true}],
		},
		// StartWithUppercase=false, lowercase is fine.
		{
			code: '{"description": "my package"}',
			options: [{startWithUppercase: false}],
		},
		// EndWithPeriod=false + startWithUppercase=false: no period, lowercase is fine.
		{
			code: '{"description": "my package"}',
			options: [{startWithUppercase: false, endWithPeriod: false}],
		},
	],
	invalid: [
		// Lowercase first letter (default).
		'{"description": "my package does things"}',
		// Trailing period (default endWithPeriod=false).
		'{"description": "My package does things."}',
		// Multiple trailing periods.
		'{"description": "My package does things..."}',
		// Both issues at once.
		'{"description": "my package does things."}',
		// EndWithPeriod=true, missing period.
		{
			code: '{"description": "My package does things"}',
			options: [{endWithPeriod: true}],
		},
		// EndWithPeriod=true + lowercase.
		{
			code: '{"description": "my package does things"}',
			options: [{endWithPeriod: true}],
		},
		// Uppercase check with endWithPeriod disabled.
		{
			code: '{"description": "my package"}',
			options: [{startWithUppercase: true, endWithPeriod: false}],
		},
	],
});
