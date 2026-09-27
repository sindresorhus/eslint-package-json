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
		// EndWithPeriod=true, and the period is already there behind trailing whitespace.
		{
			code: '{"description": "Does things. "}',
			options: [{endWithPeriod: true}],
		},
		// EndWithPeriod=true, already nothing but periods.
		{
			code: '{"description": "..."}',
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
		// A first character that is not a lowercase letter: a digit, an uppercase non-ASCII letter, a combining mark.
		'{"description": "1 thing"}',
		'{"description": "École"}',
		'{"description": "\u{301}abc"}',
		// Leading padding before an uppercase letter is left alone, like trailing padding without a period.
		'{"description": " My thing"}',
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
		// A description made only of periods ends with a period but has no period-less form, so it is
		// reported with no fix rather than silently accepted or stripped to an empty field.
		'{"description": "."}',
		'{"description": "..."}',
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
		// A lowercase letter outside ASCII is just as lowercase. The astral cases also pin that the fix
		// rewrites the whole letter rather than the first UTF-16 code unit, which would split a surrogate pair.
		'{"description": "école polytechnique"}',
		'{"description": "ökonomie"}',
		'{"description": "ελλάδα"}',
		'{"description": "привет"}',
		'{"description": "𐐨bc"}',
		// A letter with no uppercase mapping in Unicode is still reported, but there is nothing to offer as a fix.
		'{"description": "𝔞bc"}',
		// A letter whose uppercase mapping is more than one character is the same: `ß` and `ﬁ` would be
		// respelled `SS` and `FI` rather than capitalized, and the author never asked for a spelling change.
		'{"description": "ßeta tool"}',
		'{"description": "ﬁle format"}',
		// A trailing space or newline is invisible in the rendered description, so the sentence is judged
		// without it and the period goes where the sentence ends.
		{
			code: String.raw`{"description": "Does things\n"}`,
			options: [{endWithPeriod: true}],
		},
		{
			code: '{"description": "Does things "}',
			options: [{endWithPeriod: true}],
		},
		// The same trailing whitespace read the other way round: a value that still renders with a period once
		// the periods are gone would resolve the report and change nothing.
		{
			code: '{"description": "Does things. "}',
		},
		{
			code: '{"description": "Does things.  .."}',
		},
		{
			code: '{"description": "  ."}',
		},
		// A description that is nothing but padding has no sentence to end, so no period is offered.
		{
			code: '{"description": "  "}',
			options: [{endWithPeriod: true}],
		},
		{
			code: String.raw`{"description": "\n"}`,
			options: [{endWithPeriod: true}],
		},
		// Leading padding is invisible in the rendered description too, so the first letter is judged without it, and the fix takes the padding away.
		'{"description": " my thing"}',
		String.raw`{"description": "\n\tmy thing"}`,
	],
});
