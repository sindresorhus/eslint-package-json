import {getTester} from './utils/test.js';

const {test} = getTester(import.meta);

test.snapshot({
	valid: [
		// Only `node` is allowed.
		'{"engines": {"node": ">=18"}}',
		// No `engines` field.
		'{"name": "foo"}',
		// `engines` is not an object.
		'{"engines": ">=18"}',
		// The modern mechanism.
		'{"packageManager": "pnpm@9.0.0"}',
	],
	invalid: [
		'{"engines": {"npm": ">=10"}}',
		'{"engines": {"yarn": ">=4"}}',
		'{"engines": {"pnpm": ">=9"}}',
		'{"engines": {"bun": ">=1"}}',
		// Mixed with the allowed `node` engine.
		`{
			"engines": {
				"node": ">=18",
				"npm": ">=10"
			}
		}`,
	],
});
