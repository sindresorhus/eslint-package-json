import {getTester} from './utils/test.js';

const {test} = getTester(import.meta);

test.snapshot({
	valid: [
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
	],
	invalid: [
		'{"engines": {"node": "^18.0.0"}}',
		'{"engines": {"node": "~18.2"}}',
		'{"engines": {"node": "18.0.0"}}',
		'{"engines": {"node": ">=18", "npm": "^10.0.0"}}',
	],
});
