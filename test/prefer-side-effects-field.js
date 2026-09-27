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
		// An unknown field before `exports` must not pull the added `sideEffects` in front of `exports`.
		'{"custom": "x", "exports": "./index.js"}',
		// Private packages can still be bundled from a workspace.
		'{"private": true, "exports": "./index.js"}',
		// A field that canonically follows `sideEffects` but is written ahead of `exports` must not pull the
		// added `sideEffects` in front of `exports` either.
		'{"engines": {"node": ">=18"}, "exports": "./index.js"}',
		`{
  "engines": {"node": ">=18"},
  "exports": "./index.js",
  "files": ["dist"]
}`,
		// The added member is a sibling of the one it follows, so it takes that member's own indentation. The
		// deepest increase in the file is not the level these members sit at.
		`{
  "name": "a",
  "exports": {
        "./x": "./x.js",
        "./y": "./y.js"
  }
}`,
		`{
"name": "a",
"exports": {
"./x": "./x.js"
}
}`,
	],
});
