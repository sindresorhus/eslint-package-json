import {getTester} from './utils/test.js';

const {test} = getTester(import.meta);

test.snapshot({
	valid: [
		'{"exports": {"./foo/*": "./dist/foo/*"}}',
		'{"exports": {".": "./index.js"}}',
		'{"exports": "./index.js"}',
		'{"imports": {"#internal/*": "./src/internal/*.js"}}',
		'{"name": "foo"}',
	],
	invalid: [
		'{"exports": {"./foo/": "./dist/foo/"}}',
		'{"exports": {"./foo/": "./dist/*/"}}',
		'{"exports": {".": "./lib/"}}',
		`{
			"exports": {
				".": {
					"import": "./dist/"
				}
			}
		}`,
		'{"imports": {"#internal/": "./src/internal/"}}',
		// Bare string `exports` with a trailing slash.
		'{"exports": "./dist/"}',
		// Trailing slash only on the value, with a valid (non-slash) key.
		'{"imports": {"#dep": "./src/"}}',
		// Trailing slash inside an array fallback.
		'{"exports": {".": ["./dist/", "./other.js"]}}',
	],
});
