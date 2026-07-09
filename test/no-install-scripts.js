import {getTester} from './utils/test.js';

const {test} = getTester(import.meta);

test.snapshot({
	valid: [
		'{"name": "foo"}',
		'{"scripts": {"build": "tsc", "test": "ava"}}',
		// `prepublishOnly`/`prepare` are not install scripts.
		'{"scripts": {"prepare": "npm run build"}}',
	],
	invalid: [
		`{
	"scripts": {
		"preinstall": "node ./scripts/setup.js"
	}
}`,
		`{
	"scripts": {
		"install": "node-gyp rebuild"
	}
}`,
		`{
	"scripts": {
		"build": "tsc",
		"postinstall": "node ./scripts/setup.js"
	}
}`,
	],
});
