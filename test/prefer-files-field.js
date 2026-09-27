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
		// The root `package.json` is always published by npm, including when it is exported.
		'{"name": "p", "exports": {".": "./lib/index.js", "./package.json": "./package.json"}, "files": ["lib"]}',
		// The always-included `package.json` pattern is case-insensitive in npm.
		'{"name": "p", "exports": "./Package.json", "files": []}',
		// A non-array `files` is left to `valid-fields`.
		'{"name": "p", "files": 1}',
		// A non-string entry makes the allowlist unanalysable, so coverage is not judged.
		'{"name": "p", "exports": "./a.js", "files": ["a.js", 1]}',
		// A negated pattern is order-sensitive, so coverage is not judged even when a target looks uncovered.
		'{"name": "p", "exports": {".": "./lib/index.js", "./package.json": "./package.json"}, "files": ["lib", "!**/*.tsbuildinfo"]}',
		// An absolute export target is not a package-relative path, so it needs no `files` coverage.
		'{"name": "p", "exports": "/abs.js", "files": ["a.js"]}',
		'{"files": ["dist"]}',
		// The literal `main`, `browser` and `bin` value is force-included, with no `./` prefix.
		'{"main": "index.js", "files": ["dist"]}',
		'{"browser": "lib/x.js", "files": ["dist"]}',
		'{"bin": "cli.js", "files": []}',
		'{"bin": {"foo": "cli.js"}, "files": []}',
		// A `bin` target is normalized by npm, so a `./` prefix does not stop it being included.
		'{"name": "p", "bin": {"foo": "./cli.js"}, "files": ["dist"]}',
		'{"name": "p", "bin": "./cli.js", "files": ["dist"]}',
		'{"bin": "./cli.js", "files": []}',
		// An unprefixed `main` also covers an `exports` target naming the same file.
		'{"name": "p", "main": "index.js", "exports": "./index.js", "files": ["dist"]}',
		// An extglob the JSON-only matcher cannot evaluate is not proven to be uncovered.
		'{"name": "p", "exports": "./lib/x.js", "files": ["@(lib|other)"]}',
		'{"name": "p", "exports": "./lib/x.js", "files": ["+(lib|other)"]}',
		'{"name": "p", "exports": "./lib/x.js", "files": ["*(lib|other)"]}',
		'{"name": "p", "exports": "./lib/x.js", "files": ["?(lib|other)"]}',
		'{"name": "p", "exports": "./lib/x.js", "files": ["lib/!(y).js"]}',
		'{"name": "p", "exports": "./dist/foo.js", "files": ["+(dist|other)"]}',
		// A negated pattern is too order-sensitive to validate statically.
		'{"exports": "./dist/index.js", "files": ["dist", "!dist/test.js"]}',
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
		// An `imports` target is often used only by tests or dev tooling, so it is not an entry point. `no-missing-files` checks that it exists.
		'{"name": "p", "imports": {"#a": "./lib/a.js"}, "files": ["lib"]}',
		'{"name": "p", "imports": {"#a": {"default": "./lib/a.js"}}, "files": ["**/*.js"]}',
		// A `browser` replacement map names module files the bundler resolves to, and npm leaves them out
		// of the tarball when `files` misses them. A `false` value names no file.
		'{"name": "p", "browser": {"a.js": "./lib/a.js"}, "files": ["lib"]}',
		'{"name": "p", "browser": {"a.js": false, "b.js": "./lib/b.js"}, "files": ["lib"]}',
		// A `browser` value that is not written `./`-rooted is a module specifier, so it names a file inside a
		// dependency and no `files` entry covers it. This is the shape real manifests use.
		'{"name": "p", "browser": {"fs": false, "path": "path-browserify", "lodash": "lodash-es"}, "files": ["dist"]}',
		'{"name": "p", "browser": {"index": "vendor/shim.js"}, "files": ["dist"]}',
		// Npm force-includes the readme, copying, licence and `package.json` family at the package root
		// whatever `files` says, and its rules for them are case-insensitive.
		'{"name": "p", "files": ["dist"], "exports": "./README.md"}',
		'{"name": "p", "files": ["dist"], "browser": "./LICENSE"}',
		'{"name": "p", "files": ["dist"], "exports": "./readme"}',
		'{"name": "p", "files": ["dist"], "exports": "./Copying.txt"}',
		'{"name": "p", "files": ["dist"], "exports": "./LICENCE"}',
		// Npm 12 publishes nothing for a `files` entry naming the package root, but `main` and `bin` are force-included anyway.
		'{"name": "p", "files": ["./"], "main": "index.js"}',
		'{"name": "p", "files": ["./"], "bin": {"p": "./index.js"}}',
		// Node resolves an extensionless `main` by trying extensions and `index` files, which the rule does not model, so it is never reported.
		'{"name": "p", "main": "./index", "files": ["index.js"]}',
		'{"name": "p", "main": "./lib", "files": ["lib/index.js"]}',
		// Npm strips every trailing slash from a `files` entry.
		'{"name": "p", "exports": "./dist/x.js", "files": ["dist//"]}',
		'{"name": "p", "imports": {"#a": "./lib/a.js"}, "files": ["dist"]}',
		'{"name": "p", "imports": {"#a": {"default": "./lib/a.js"}}, "files": ["dist"]}',
		// A subpath pattern target is covered when a `files` entry could publish a file it matches: one beneath its literal prefix, or any entry for an empty prefix. Npm 12 packs both.
		'{"name": "p", "exports": {".": "./index.js", "./*": "./*"}, "files": ["index.js", "dist"]}',
		'{"name": "p", "exports": {".": "./dist/index.js", "./*": "./dist/*.js"}, "files": ["dist/index.js", "dist/utils.js"]}',
		// A glob entry covers a wildcard target when some file matches both, as `dist/x.js` does here.
		'{"name": "p", "exports": {".": "./dist/index.js", "./*": "./dist/*"}, "files": ["dist/**/*.js", "dist/**/*.d.ts"]}',
		'{"name": "p", "exports": {".": "./dist/index.js", "./*": "./dist/*"}, "files": ["dist/*.js"]}',
		'{"name": "p", "exports": {".": "./index.js", "./*": "./*"}, "files": ["*.js"]}',
		// `glob` reads `a/./b` and `a//b` as `a/b`, so npm 12 packs `dist/index.js` for both.
		'{"name": "p", "exports": "./dist/index.js", "files": ["dist/./index.js"]}',
		'{"name": "p", "exports": "./dist/index.js", "files": ["dist//index.js"]}',
		// A dot does not make an entry a file when the target's own path runs through it.
		'{"name": "p", "exports": "./lib.v2/index.js", "files": ["lib.v2"]}',
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
		// Only the root `package.json` is automatically included; nested manifests still need coverage.
		'{"name": "p", "exports": {".": "./lib/index.js", "./metadata": "./sub/package.json"}, "files": ["lib"]}',
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
		// The force-inclusion rule is the literal field value, so a `./` prefix names a different
		// path and the file is not published.
		'{"main": "./index.js", "files": ["dist"]}',
		// `.` names the package root but publishes nothing, so the entry point is uncovered.
		'{"name": "p", "exports": "./dist/index.js", "files": ["."]}',
		'{"browser": "./lib/x.js", "files": ["dist"]}',
		'{"name": "p", "main": "./index.js", "exports": "./index.js", "files": ["dist"]}',
		// Repeated wildcards must not cause exponential backtracking.
		adversarialGlob,
		// A `browser` replacement map whose value `files` misses.
		'{"name": "p", "browser": {"a.js": "./lib/a.js"}, "files": ["dist"]}',
		// A `browser` replacement map with no `files` at all still needs one.
		'{"name": "p", "browser": {"a.js": "./lib/a.js"}}',
		// The family is root-only: a nested readme is not published, because its directory stays excluded.
		'{"name": "p", "files": ["dist"], "exports": {"./readme": "./docs/README.md"}}',
		'{"name": "p", "files": ["dist"], "exports": "./docs/LICENSE"}',
		// `.` and `./.` name the package root but publish nothing, so the entry point is still uncovered.
		'{"name": "p", "files": ["."], "exports": "./index.js"}',
		'{"name": "p", "files": ["./."], "exports": "./index.js"}',
		// Npm 12 strips only one leading `./` or `/` and publishes nothing for an entry naming the package root, so none of these covers anything. Verified with `npm pack`.
		'{"name": "p", "exports": "./dist/b.js", "files": ["//dist"]}',
		'{"name": "p", "exports": "./dist/b.js", "files": [".//dist"]}',
		'{"name": "p", "files": ["./"], "exports": "./index.js"}',
		'{"name": "p", "files": ["/"], "exports": "./index.js"}',
		'{"name": "p", "files": ["//"], "exports": "./index.js"}',
		'{"name": "p", "files": ["./"], "exports": {"./a": "./dist/a.js"}}',
		'{"name": "p", "files": ["/"], "exports": "./dist/index.js"}',
		// An entry that publishes nothing covers no subpath pattern target, even one with an empty literal prefix.
		'{"name": "p", "files": ["."], "exports": {"./*": "./*"}}',
		'{"name": "p", "files": ["//dist"], "exports": {"./*": "./*"}}',
		// An entry outside the literal prefix cannot publish a file the target matches.
		'{"name": "p", "files": ["distribution"], "exports": {"./*": "./dist/*.js"}}',
		// A glob entry has to match the target itself, so a suffix that rules out every file the target names covers nothing.
		'{"name": "p", "files": ["dist/*.js"], "exports": {".": "./dist/index.js", "./styles/*": "./dist/*.css"}}',
		'{"name": "p", "files": ["index.js", "dist/*.d.ts"], "exports": {".": "./index.js", "./*": "./dist/*.js"}}',
		// An entry beneath the target's literal prefix covers it only when it can name a file the target matches. `dist/index.d.ts` is taken to be a file, and it is not a `.js` one.
		'{"name": "p", "files": ["dist/index.d.ts"], "exports": {"./*": "./dist/*.js"}}',
		// A `**/` segment matches whole segments, so `**/index.js` does not publish `myindex.js`.
		'{"name": "p", "files": ["**/index.js"], "exports": "./myindex.js"}',
	],
});
