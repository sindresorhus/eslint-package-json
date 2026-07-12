import {getTester} from './utils/test.js';

const {test} = getTester(import.meta);

test.snapshot({
	valid: [
		'{"name": "foo"}',
		// Type package with a matching runtime dependency.
		'{"dependencies": {"foo": "^1.0.0"}, "devDependencies": {"@types/foo": "^1.0.0"}}',
		// Matching across groups.
		'{"peerDependencies": {"react": "^18.0.0"}, "devDependencies": {"@types/react": "^18.0.0"}}',
		// Matching through optionalDependencies.
		'{"optionalDependencies": {"foo": "^1.0.0"}, "devDependencies": {"@types/foo": "^1.0.0"}}',
		// Ambient type packages with no runtime counterpart are ignored by default.
		'{"devDependencies": {"@types/node": "^20.0.0"}}',
		'{"devDependencies": {"@types/bun": "^1.0.0"}}',
		// Scoped types map to the scoped package.
		'{"dependencies": {"@foo/bar": "^1.0.0"}, "devDependencies": {"@types/foo__bar": "^1.0.0"}}',
		// User-supplied `ignore` accepts either the type package or runtime package name.
		{code: '{"devDependencies": {"@types/foo": "^1.0.0"}}', options: [{ignore: ['@types/foo']}]},
		{code: '{"devDependencies": {"@types/foo": "^1.0.0"}}', options: [{ignore: ['foo']}]},
		{code: '{"devDependencies": {"@types/foo__bar": "^1.0.0"}}', options: [{ignore: ['@types/foo__bar']}]},
		{code: '{"devDependencies": {"@types/foo__bar": "^1.0.0"}}', options: [{ignore: ['@foo/bar']}]},
	],
	invalid: [
		`{
	"devDependencies": {
		"@types/foo": "^1.0.0"
	}
}`,
		`{
	"devDependencies": {
		"@types/foo": "^1.0.0",
		"bar": "^1.0.0"
	}
}`,
		// Scoped types without the scoped package.
		'{"devDependencies": {"@types/foo__bar": "^1.0.0"}}',
		// An orphan type in `dependencies` is flagged too, not just `devDependencies`.
		'{"dependencies": {"@types/foo": "^1.0.0"}}',
	],
});
