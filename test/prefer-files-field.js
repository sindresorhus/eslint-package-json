import {getTester} from './utils/test.js';

const {test} = getTester(import.meta);
const adversarialGlob = JSON.stringify({
	exports: `./${'a'.repeat(32)}.js`,
	files: [('*a'.repeat(16)) + '*z'],
});
const manyEntryPoints = Object.fromEntries(Array.from({length: 33}, (_, index) => [`./feature-${index}`, `./dist/feature-${index}.js`]));
const largeCoverageMatrix = JSON.stringify({
	exports: manyEntryPoints,
	files: Array.from({length: 33}, (_, index) => `other-${index}`),
});

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
		'{"exports": "./dist/foo.js", "files": ["dist/**/*.js"]}',
		'{"exports": "./dist/nested/foo.js", "files": ["dist/**/*.js"]}',
		'{"exports": "./dist/index.js", "files": ["dist/**/index.js"]}',
		'{"exports": "./dist/nested/index.js", "files": ["dist/**/index.js"]}',
		// Large coverage matrices are skipped to keep validation bounded.
		largeCoverageMatrix,
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
		'{"exports": "./dist/nested/foo.js", "files": ["dist/*.js"]}',
		'{"exports": "./a", "files": ["a*a"]}',
		'{"exports": "./ba", "files": ["a"]}',
		// Repeated wildcards must not cause exponential backtracking.
		adversarialGlob,
	],
});
