import {getTester} from './utils/test.js';

const {test} = getTester(import.meta);

test.snapshot({
	valid: [
		'{}',
		'"package"',
		'{"scripts": 1}',
		'{"scripts": []}',
		'{"scripts": {"build": "tsc", "prebuild": "npm run clean", "postbuild": "npm run check"}}',
		'{"scripts": {"build": "tsc", "postbuild": "npm run check", "prepostbuild": "npm run clean"}}',
		'{"scripts": {"pre": "echo before", "post": "echo after"}}',
		// The npm CLI provides implicit `env` and `restart` scripts.
		'{"scripts": {"preenv": "echo before"}}',
		'{"scripts": {"postenv": "echo after"}}',
		'{"scripts": {"prerestart": "echo before"}}',
		'{"scripts": {"postrestart": "echo after"}}',
		// The npm lifecycle scripts run without a base script.
		`{
	"scripts": {
		"prepare": "echo prepare",
		"prepublish": "echo prepublish",
		"prepublishOnly": "echo prepublish-only",
		"prepack": "echo prepack",
		"postpack": "echo postpack",
		"preinstall": "echo preinstall",
		"postinstall": "echo postinstall",
		"preprepare": "echo preprepare",
		"postprepare": "echo postprepare",
		"postpublish": "echo postpublish",
		"predependencies": "echo predependencies",
		"postdependencies": "echo postdependencies",
		"preversion": "echo preversion",
		"postversion": "echo postversion"
	}
}`,
		'{"scripts": {"preprepare": "echo preprepare", "postprepare": "echo postprepare"}}',
		// A malformed base script is handled by `valid-fields`.
		'{"scripts": {"build": false, "prebuild": "npm run clean"}}',
		// Standalone names can be exempted explicitly.
		{code: '{"scripts": {"prettier": "prettier --check .", "preview": "vite preview", "postcss": "postcss src/index.css"}}', options: [{ignore: ['prettier', 'preview', 'postcss']}]},
		// An implicit npm `start` script needs an explicit exemption.
		{code: '{"scripts": {"prestart": "npm run setup"}}', options: [{ignore: ['prestart']}]},
	],
	invalid: [
		`{
	"scripts": {
		"prebuild": "npm run clean"
	}
}`,
		'{"scripts": {"posttest": "npm run clean"}}',
		'{"scripts": {"prestart": "npm run setup"}}',
		'{"scripts": {"prebuild": "npm run clean", "posttest": "npm run clean"}}',
		{code: '{"scripts": {"prettier": "prettier --check .", "postcss": "postcss src/index.css"}}', options: [{ignore: ['prettier']}]},
		// A standalone command with a hook-like name needs `ignore`.
		'{"scripts": {"prettier": "prettier --check ."}}',
	],
});
