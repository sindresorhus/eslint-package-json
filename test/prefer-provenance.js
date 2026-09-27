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
		// A multiline root with an inline `publishConfig`: the new member belongs inside the braces on the same line, not on a fresh line indented to the `publishConfig` key itself.
		`{
	"name": "my-package",
	"publishConfig": {"access": "public"}
}`,
		// Two-space indentation, to prove the indent is read from the file rather than assumed.
		`{
  "name": "my-package",
  "publishConfig": {"access": "public"}
}`,
		// A single-line empty `publishConfig` stays on one line, the way the non-empty case does.
		'{"name": "x", "publishConfig": {}, "version": "1.0.0"}',
		'{"publishConfig": {}, "name": "x"}',
		// A multiline empty `publishConfig` gets the member on its own line, with no stray blank line
		// left over from the whitespace the empty object already held.
		'{\n\t"publishConfig": {\n\t}\n}',
		'{\n  "name": "x",\n  "publishConfig": {\n  }\n}',
		// A first member on the opening line with the rest on lines of their own: the new member takes the indentation of the members that have one.
		'{\n\t"publishConfig": {"access": "public",\n\t\t"tag": "x"}\n}',
	],
});
