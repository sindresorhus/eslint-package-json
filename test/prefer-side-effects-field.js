import {getTester} from './utils/test.js';

const {test} = getTester(import.meta);

test.snapshot({
	valid: [
		// No `exports` field.
		'{"name": "foo"}',
		'{"main": "./index.js", "module": "./index.mjs", "browser": "./browser.js"}',
		'{"imports": {"#feature": {"default": "./feature.js"}}}',
		// An existing field is out of scope, regardless of its value.
		'{"exports": "./index.js", "sideEffects": false}',
		'{"exports": {"default": "./index.js"}, "sideEffects": true}',
		'{"exports": {"./feature": "./feature.js"}, "sideEffects": ["*.css"]}',
		'{"exports": "./index.js", "sideEffects": "false"}',
	],
	invalid: [
		// Common `exports` forms.
		'{"exports": "./index.js"}',
		`{
  "name": "my-package",
  "exports": {
    "default": "./index.js"
  },
  "engines": {"node": ">=18"}
}`,
		'{"exports": {"./feature": "./feature.js"}}',
		'{"exports": ["./index.js", "./fallback.js"]}',
		'{"exports": "./index.js", "custom": true}',
		'{\r\n\t"exports": "./index.js",\r\n\t"engines": {"node": ">=18"}\r\n}',
		// Private packages can still be bundled from a workspace.
		'{"private": true, "exports": "./index.js"}',
	],
});
