import {getTester} from './utils/test.js';

const {test} = getTester(import.meta);

test.snapshot({
	valid: [
		// PublishConfig has provenance: true.
		'{"publishConfig": {"provenance": true}}',
		// Private package is skipped entirely.
		'{"private": true, "publishConfig": {"provenance": false}}',
		'{"private": true, "publishConfig": {}}',
		'{"private": true}',
		// No publishConfig: rule only acts when publishConfig is present.
		'{"name": "foo"}',
		// PublishConfig is not an Object (out of scope).
		'{"publishConfig": "string-value"}',
	],
	invalid: [
		// PublishConfig exists but has no provenance.
		'{"publishConfig": {}}',
		// PublishConfig exists with provenance: false.
		'{"publishConfig": {"provenance": false}}',
		// PublishConfig with other fields, no provenance.
		'{"publishConfig": {"access": "public"}}',
		// Multiline — insertion indentation test.
		`{
	"name": "my-package",
	"publishConfig": {
		"access": "public"
	}
}`,
		// Multiline empty publishConfig.
		`{
	"name": "my-package",
	"publishConfig": {}
}`,
		// Provenance: false in multiline context.
		`{
	"name": "my-package",
	"publishConfig": {
		"access": "public",
		"provenance": false
	}
}`,
		// Private: false does NOT skip the rule.
		'{"private": false, "publishConfig": {}}',
	],
});
