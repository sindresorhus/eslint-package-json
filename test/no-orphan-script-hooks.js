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
		// Common standalone tool names are exempt.
		'{"scripts": {"prettier": "prettier --check .", "prettier:fix": "prettier --write ."}}',
		'{"scripts": {"preview": "vite preview", "preview:production": "vite preview --mode production"}}',
		'{"scripts": {"postcss": "postcss src/index.css", "postcss:build": "postcss src/index.css"}}',
		'{"scripts": {"posthtml": "posthtml -o output.html -i input.html", "posthtml:build": "posthtml -o output.html -i input.html"}}',
		// Namespaced `prepare` scripts are standalone commands, not `pre` hooks.
		'{"scripts": {"prepare:safari": "npm run build"}}',
		// Git hook script names are standalone commands, not `pre` hooks.
		'{"scripts": {"precommit": "lint-staged", "pre-commit": "lint-staged", "prepush": "npm test", "pre-push": "npm test"}}',
		// Standalone names can be exempted explicitly.
		{code: '{"scripts": {"preflight": "npm run check"}}', options: [{ignore: ['^preflight$']}]},
		{code: '{"scripts": {"prebuild": "npm run build", "pretest": "npm test"}}', options: [{ignore: [/^pre/g]}]},
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
		'{"scripts": {"prettierx": "echo no", "previewing": "echo no", "postcssx": "echo no"}}',
		'{"scripts": {"prebuild:watch": "npm run clean"}}',
		// Namespaced Git-like names remain hooks and need a matching target.
		'{"scripts": {"precommit:lint": "lint-staged", "pre-commit:checks": "lint-staged", "prepush:ci": "npm test", "pre-push:checks": "npm test"}}',
		// A standalone command with a hook-like name needs `ignore`.
		'{"scripts": {"preflight": "npm run check"}}',
	],
});
