import {getTester} from './utils/test.js';

const {test} = getTester(import.meta);

test.snapshot({
	valid: [
		// A malformed range has nothing to convert; converting it would only produce another malformed range.
		'{"engines": {"node": "^"}}',
		'{"engines": {"node": "^abc"}}',
		'{"engines": {"node": "~"}}',
		// A wildcard range is already open-ended.
		'{"engines": {"node": "*"}}',
		'{"engines": {"node": "x"}}',
		'{"engines": {"node": "~x"}}',
		'{"engines": {"node": ">=18"}}',
		'{"engines": {"node": ">=18 <21"}}',
		'{"engines": {"node": "18 || 20 || 22"}}',
		'{"engines": {"node": "*"}}',
		// Major-only ranges are left alone.
		'{"engines": {"node": "18"}}',
		// Compound ranges do not convert cleanly, so they are left alone.
		'{"engines": {"node": "^18 || ^20"}}',
		'{"engines": {"node": "^18 <20"}}',
		// Non-string and non-object values are ignored.
		'{"engines": {"node": true}}',
		'{"engines": "node"}',
		// A compound range is left alone whatever its operators.
		'{"engines": {"node": ">=18 || >=20"}}',
		// A bare `=` pin on a major-only version is the same closed range as the bare `18`.
		'{"engines": {"node": "=18"}}',
	],
	invalid: [
		'{"engines": {"node": "^18.0.0"}}',
		'{"engines": {"node": "~18.2"}}',
		// These resolve to the same closed range as the bare `18` left alone above; only the explicit operator form is rewritten.
		'{"engines": {"node": "^18"}}',
		'{"engines": {"node": "~18"}}',
		'{"engines": {"node": "18.0.0"}}',
		'{"engines": {"node": ">=18", "npm": "^10.0.0"}}',
		// A loose version must normalize before it is put into a range.
		'{"engines": {"node": "v18.0.0"}}',
		'{"engines": {"node": "^v18.0.0"}}',
		'{"engines": {"node": "18.0.0+build.1"}}',
		// Node-semver also spells a tilde range with two characters, and the whole operator goes.
		'{"engines": {"node": "~>1.2.3"}}',
		'{"engines": {"node": "~=1.2.3"}}',
		'{"engines": {"node": "~>18"}}',
		// Node-semver reads an `=` after either operator as a pin, not a comparator.
		'{"engines": {"node": "~>=1.2.3"}}',
		'{"engines": {"node": "^=1.2.3"}}',
		// A bare `=` pin is the same exact version as the bare `18.0.0`.
		'{"engines": {"node": "=18.0.0"}}',
		'{"engines": {"node": "=v18.0.0"}}',
	],
});
