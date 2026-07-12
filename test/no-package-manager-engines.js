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
		// The migration suggestion should add the inferred package manager field.
		`{
			"engines": {
				"node": ">=24",
				"npm": ">=11"
			}
		}`,
		// Remove a manager that is not the last nested member and preserve following top-level fields.
		`{
			"name": "foo",
			"engines": {
				"npm": ">=11",
				"node": ">=24"
			},
			"scripts": {}
		}`,
		// Multiple package manager engines cannot be migrated into one field.
		'{"engines": {"npm": ">=10", "yarn": ">=4"}}',
		// Do not replace an existing package manager field.
		'{"packageManager": "npm@10.0.0", "engines": {"npm": ">=10"}}',
		// Ranges without a lower bound cannot be safely pinned.
		'{"engines": {"npm": "<11"}}',
		// Compound ranges use their lowest semver version.
		'{"engines": {"npm": ">=10 <11"}}',
		// Strict lower bounds pin the next semver release.
		'{"engines": {"npm": ">10"}}',
		// Bare versions are normalized to three components.
		'{"engines": {"npm": "10.2"}}',
		// Prerelease lower bounds are valid exact package manager versions.
		'{"engines": {"npm": ">=10.0.0-beta.1"}}',
		// An unbounded alternative cannot be safely pinned.
		'{"engines": {"npm": ">=10 || *"}}',
		// Preserve top-level single-line formatting when `engines` is multiline.
		'{"engines": {\n\t"node": ">=18",\n\t"npm": ">=10"\n}}',
		// Preserve CRLF formatting.
		'{\r\n\t"engines": {\r\n\t\t"node": ">=18",\r\n\t\t"npm": ">=10"\r\n\t}\r\n}',
		// Wildcards, malformed values, and non-string values cannot be safely pinned.
		'{"engines": {"npm": "*"}}',
		'{"engines": {"npm": ""}}',
		'{"engines": {"npm": "latest"}}',
		'{"engines": {"npm": true}}',
	],
});
