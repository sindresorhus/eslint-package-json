import {getTester} from './utils/test.js';

const {test} = getTester(import.meta);

test.snapshot({
	valid: [
		'{"engines": {"node": ">=20"}}',
		'{"engines": {"node": ">=20", "npm": ">=10"}}',
	],
	invalid: [
		'{"name": "foo"}',
		'{"engines": {"npm": ">=10"}}',
		'{"engines": "node"}',
	],
});
