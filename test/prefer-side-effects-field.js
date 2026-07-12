import {getTester} from './utils/test.js';

const {test} = getTester(import.meta);

test.snapshot({
	valid: [
		// No `exports` field.
		'{"name": "foo"}',
		'{"main": "./index.js"}',
		'{"module": "./index.mjs"}',
		'{"browser": "./browser.js"}',
		'{"imports": {"#feature": {"module": "./module.js"}}}',
		// No bundler conditions.
		'{"type": "module"}',
		'{"exports": "./index.js"}',
		'{"exports": {"import": "./index.js", "default": "./index.js"}}',
		'{"exports": {"./browser": "./browser.js"}}',
		'{"imports": {"#module": "./module.js"}}',
		'{"exports": {"module2": "./index.js", "browserify": "./browser.js"}}',
		'{"exports": "./index.js", "imports": {"#feature": {"module2": "./module.js", "browserify": "./browser.js"}}}',
		'{"exports": "./index.js", "module": "./module.js", "browser": "./browser.js"}',
		// An existing field is out of scope, regardless of its value.
		'{"module": "./index.js", "sideEffects": false}',
		'{"exports": {"browser": "./browser.js"}, "sideEffects": true}',
		'{"exports": {"module": "./index.js"}, "sideEffects": ["*.css"]}',
		'{"exports": "./index.js", "imports": {"#feature": {"module": "./module.js"}}, "sideEffects": false}',
		'{"exports": {"module": "./index.js"}, "sideEffects": "false"}',
	],
	invalid: [
		// Nested conditions in `exports` and `imports`.
		'{"exports": {"module": "./index.js"}}',
		'{"exports": {"./feature": {"browser": "./browser.js"}}}',
		'{"exports": "./index.js", "imports": {"#feature": {"module": "./module.js"}}}',
		'{"exports": "./index.js", "imports": {"#feature": {"browser": "./browser.js"}}}',
		// Conditions nested through arrays and multiple object levels.
		'{"exports": [{"./feature": {"browser": "./browser.js"}}]}',
		// Private packages can still be bundled from a workspace.
		'{"private": true, "exports": {"module": "./index.js"}}',
	],
});
