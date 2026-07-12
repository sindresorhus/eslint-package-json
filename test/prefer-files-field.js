import {getTester} from './utils/test.js';

const {test} = getTester(import.meta);

test.snapshot({
	valid: [
		'{"files": ["dist"]}',
		// `main` and `bin` are automatically included by npm.
		'{"main": "./index.js", "files": ["dist"]}',
		'{"bin": "./cli.js", "files": []}',
		// A negated pattern is too order-sensitive to validate statically.
		'{"exports": "./dist/index.js", "files": ["dist", "!dist/test.js"]}',
		'{"exports": "./dist/index.js", "files": ["."]}',
		'{"exports": "./dist/foo.js", "files": ["*.js"]}',
		'{"exports": "./dist/foo.js", "files": ["dist/f?o.js"]}',
		'{"exports": "./dist/nested/foo.js", "files": ["dist/*"]}',
		// Invalid entry-point targets are handled by `valid-fields`.
		'{"exports": "../dist/index.js", "files": ["dist"]}',
		// External browser entry points are not files in the package.
		'{"browser": "https://cdn.example.com/index.js", "files": ["dist"]}',
		// Private packages are not published.
		'{"name": "foo", "private": true}',
	],
	invalid: [
		'{"name": "foo"}',
		'{"name": "foo", "private": false}',
		'{"exports": "./dist/index.js", "files": ["src"]}',
		'{"types": "./types/index.d.ts", "files": ["dist"]}',
		'{"exports": "./src/**/*.js", "files": ["dist"]}',
	],
});
