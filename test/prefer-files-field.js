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
		// A rooted glob covers a root-level file.
		'{"name": "p", "exports": "./index.js", "files": ["*.js"]}',
		// A literal directory name publishes everything beneath it.
		'{"name": "p", "exports": "./dist/b.js", "files": ["dist"]}',
		// A leading slash is stripped by npm, so `/dist` names the same package-root directory as `dist`.
		'{"name": "p", "exports": "./dist/b.js", "files": ["/dist"]}',
		'{"name": "p", "exports": "./dist/b.js", "files": ["//dist"]}',
		// A wildcard can match a directory and publish everything beneath it.
		'{"name": "p", "exports": "./dist/b.js", "files": ["*t*"]}',
		// A glob covers a path with the same number of segments.
		'{"name": "p", "exports": "./a/c.js", "files": ["*/*.js"]}',
		// `**` crosses path separators.
		'{"name": "p", "exports": "./a/b/c.js", "files": ["**/*.js"]}',
		// Several wildcards in one segment match when their literals appear in order.
		'{"name": "p", "exports": "./a-b-c.js", "files": ["a*b*c.js"]}',
		// An embedded `**` matches within one path segment.
		'{"name": "p", "exports": "./aXb.js", "files": ["a**b.js"]}',
		// `main` is published by npm regardless of the allowlist, so only `types` needs covering.
		'{"name": "p", "main": "diff.js", "types": "diff.d.ts", "files": ["diff.d.ts"]}',
		// A non-array `files` is left to `valid-fields`.
		'{"name": "p", "files": 1}',
		// A non-string entry makes the allowlist unanalysable, so coverage is not judged.
		'{"name": "p", "exports": "./a.js", "files": ["a.js", 1]}',
		// A negated pattern is order-sensitive, so coverage is not judged even when a target looks uncovered.
		'{"name": "p", "exports": {".": "./lib/index.js", "./package.json": "./package.json"}, "files": ["lib", "!**/*.tsbuildinfo"]}',
		// An absolute export target is not a package-relative path, so it needs no `files` coverage.
		'{"name": "p", "exports": "/abs.js", "files": ["a.js"]}',
		'{"files": ["dist"]}',
		// `main` and `bin` are automatically included by npm.
		'{"main": "./index.js", "files": ["dist"]}',
		'{"bin": "./cli.js", "files": []}',
		// A negated pattern is too order-sensitive to validate statically.
		'{"exports": "./dist/index.js", "files": ["dist", "!dist/test.js"]}',
		'{"exports": "./dist/index.js", "files": ["."]}',
		// A bare `*` pattern publishes every root entry, so any target is covered.
		'{"name": "p", "exports": "./dist/index.js", "files": ["*"]}',
		// A wildcard target's fixed prefix directory is covered by a literal `files` entry naming that directory.
		'{"name": "p", "exports": {"./x": "./dist/*.js"}, "files": ["dist"]}',
		'{"exports": "./dist/foo.js", "files": ["dist/f?o.js"]}',
		'{"exports": "./dist/nested/foo.js", "files": ["dist/*"]}',
		'{"exports": "./dist/foo.js", "files": ["dist/**/*.js"]}',
		'{"exports": "./dist/nested/foo.js", "files": ["dist/**/*.js"]}',
		'{"exports": "./dist/index.js", "files": ["dist/**/index.js"]}',
		'{"exports": "./dist/nested/index.js", "files": ["dist/**/index.js"]}',
		'{"exports":{"./x":"./missing.js","./x":"./covered.js"},"files":["covered.js"]}',
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
		// A wildcard that does not match the directory leaves the entry point uncovered.
		'{"name": "p", "exports": "./dist/b.js", "files": ["d*e"]}',
		// A single `*` never crosses a path separator, so the segment counts must line up.
		'{"name": "p", "exports": "./a/b/c.js", "files": ["*/*.js"]}',
		// A wildcard that matches no directory or file leaves the entry point uncovered.
		'{"name": "p", "exports": "./dist/b.js", "files": ["other*"]}',
		// `files` patterns are rooted, so `*.js` publishes only root-level files, not `dist/foo.js`.
		'{"exports": "./dist/foo.js", "files": ["*.js"]}',
		// A literal `files` entry covers targets beneath it, but not an unrelated sibling.
		'{"name": "p", "exports": {".": "./lib/index.js", "./package.json": "./package.json"}, "files": ["lib"]}',
		'{"name": "foo"}',
		'{"name": "foo", "private": false}',
		'{"exports": "./dist/index.js", "files": ["src"]}',
		'{"types": "./types/index.d.ts", "files": ["dist"]}',
		'{"exports": "./src/**/*.js", "files": ["dist"]}',
		'{"exports": "./dist/nested/foo.js", "files": ["dist/*.js"]}',
		'{"exports": "./a", "files": ["a*a"]}',
		// An embedded `**` is still limited to one path segment.
		'{"exports": "./a/nested/b.js", "files": ["a**b.js"]}',
		'{"exports": "./aX/wrong/c.js", "files": ["a**b/**/c.js"]}',
		'{"exports": "./ba", "files": ["a"]}',
		// A shadowed `bin` duplicate is not an entry point npm publishes, so it must not mark the uncovered `exports` target as auto-included.
		'{"name": "p", "bin": {"x": "./index.js", "x": "./other.js"}, "exports": "./index.js", "files": ["dist"]}',
		// Repeated wildcards must not cause exponential backtracking.
		adversarialGlob,
	],
});
