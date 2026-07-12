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
		// @types packages in optionalDependencies and peerDependencies are outside this rule's scope.
		'{"optionalDependencies": {"@types/foo": "^1.0.0"}}',
		'{"peerDependencies": {"@types/foo": "^1.0.0"}}',
		// Ambient type packages with no runtime counterpart are ignored by default.
		'{"devDependencies": {"@types/node": "^20.0.0"}}',
		'{"devDependencies": {"@types/bun": "^1.0.0"}}',
		'{"devDependencies": {"@types/chrome": "^0.0.1"}}',
		'{"devDependencies": {"@types/deno": "^1.0.0"}}',
		'{"devDependencies": {"@types/firefox-webext-browser": "^1.0.0"}}',
		'{"devDependencies": {"@types/google-apps-script": "^1.0.0"}}',
		'{"devDependencies": {"@types/serviceworker": "^1.0.0"}}',
		'{"devDependencies": {"@types/cordova": "^1.0.0"}}',
		'{"devDependencies": {"@types/trusted-types": "^1.0.0"}}',
		'{"devDependencies": {"@types/web-bluetooth": "^1.0.0"}}',
		'{"devDependencies": {"@types/webxr": "^1.0.0"}}',
		'{"devDependencies": {"@types/w3c-web-usb": "^1.0.0"}}',
		'{"devDependencies": {"@types/w3c-web-hid": "^1.0.0"}}',
		'{"devDependencies": {"@types/w3c-web-serial": "^1.0.0"}}',
		'{"devDependencies": {"@types/w3c-image-capture": "^1.0.0"}}',
		'{"devDependencies": {"@types/webgl-ext": "^1.0.0"}}',
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
