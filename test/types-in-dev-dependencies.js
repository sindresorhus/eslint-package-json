import {getTester} from './utils/test.js';

const {test} = getTester(import.meta);

test.snapshot({
	valid: [
		// @types/* in devDependencies is fine.
		'{"devDependencies": {"@types/node": "^20.0.0"}}',
		// Non-@types packages in dependencies are fine.
		'{"dependencies": {"foo": "^1.0.0"}}',
		// No dependencies field.
		'{"name": "my-package"}',
		// Regular packages in dependencies are fine.
		'{"dependencies": {"@scope/package": "^1.0.0"}}',
		// @types in both devDeps is fine.
		'{"devDependencies": {"@types/node": "^20.0.0"}, "dependencies": {"foo": "^1.0.0"}}',
		// Non-string values in dependencies are fine.
		'{"dependencies": {"foo": 1}}',
		// Empty dependencies.
		'{"dependencies": {}}',
		// @types in peerDependencies is allowed (a library may expose types from a peer).
		'{"peerDependencies": {"@types/react": ">=18"}}',
		// Ignored package name: its types leak into the public API, so it must stay a real dependency.
		{
			code: '{"dependencies": {"@types/node": "^20.0.0"}}',
			options: [{ignore: ['@types/node']}],
		},
	],
	invalid: [
		// @types/* in dependencies should be flagged.
		'{"dependencies": {"@types/node": "^20.0.0"}}',
		// Multiple @types in dependencies.
		'{"dependencies": {"@types/node": "^20.0.0", "@types/react": "^18.0.0"}}',
		// Mixed: regular and @types in dependencies.
		'{"dependencies": {"foo": "^1.0.0", "@types/node": "^20.0.0"}}',
		// @types with scoped name.
		'{"dependencies": {"@types/some-package": "^1.0.0"}}',
		// @types in optionalDependencies should also be flagged (no runtime value there either).
		'{"optionalDependencies": {"@types/node": "^20.0.0"}}',
		// Moving into an existing, non-empty devDependencies.
		'{"dependencies": {"@types/node": "^20.0.0"}, "devDependencies": {"foo": "^1.0.0"}}',
		// Already present in devDependencies at a different range: ambiguous, no fix is offered.
		'{"dependencies": {"@types/node": "^20.0.0"}, "devDependencies": {"@types/node": "^19.0.0"}}',
		// A malformed (non-object) devDependencies is left to `valid-fields`; no fix is offered.
		'{"dependencies": {"@types/node": "^20.0.0"}, "devDependencies": "invalid"}',
		// A non-string range is malformed; the entry is reported but no fix is offered.
		'{"dependencies": {"@types/node": 1}}',
		// Multiline input: the moved entry preserves the file's indentation.
		`{
	"dependencies": {
		"@types/node": "^20.0.0"
	},
	"devDependencies": {
		"foo": "^1.0.0"
	}
}`,
	],
});
