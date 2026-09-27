# prefer-files-field

📝 Require a `files` allowlist that covers published entry points.

💼 This rule is enabled in the ✅ `recommended` [config](https://github.com/sindresorhus/eslint-package-json#configs).

<!-- end auto-generated rule header -->
<!-- Do not manually modify this header. Run: `npm run fix:eslint-docs` -->

This rule requires non-private packages to declare a `files` allowlist and reports entry points definitely omitted by simple paths, directories, or globs. It skips negated or ambiguous patterns and accounts for npm automatically including the root `package.json`, `main`, `browser`, and `bin`. npm matches `main` and `browser` as written, so with a `./` prefix they still need a `files` entry. npm's always-included `package.json` pattern is case-insensitive, so casing variants do not need corresponding `files` entries. The `./` values of a `browser` replacement map need `files` entries too, while its bare values are module specifiers and are skipped.

`imports` targets are not checked, since they often serve only tests or tooling. A `main` without a file extension, like `./index`, is never reported.

Matching follows npm 12's own `files` semantics, which are stricter than they look:

- Patterns are rooted at the package directory, so `*.js` publishes `index.js` but not `lib/index.js`. One leading `./` or `/` is stripped, making `dist`, `./dist`, and `/dist` the same entry, while `//dist` publishes nothing.
- A single `*` never crosses a path separator, so `*/*.js` publishes `lib/a.js` but not `lib/nested/a.js`. Use `**` to cross separators.
- Character classes and extglobs (`[ab].js`, `@(a|b).js`) are not modeled, so an entry using them counts as covering every target.
- `.`, `./`, and `/` publish nothing, while `*` and `**` publish everything.
- npm expands directories matched by wildcard patterns too. Both `dist` and `d*` publish everything beneath the matching directory.
- A pattern target like `./dist/*.js` is covered by an entry that may publish a matching file, such as `dist/index.js` or `dist/**/*.js`, but not `dist/*.css`.
- An entry whose last segment has a file extension, like `dist/index.d.ts`, is taken to be a file, unless an entry point's path runs through it (`./lib.v2/index.js`).

Run `npm pack --dry-run` to verify the actual tarball, including `.npmignore` and filesystem contents.

## Examples

```json
// ❌ — `files` patterns are rooted, so `*.js` does not publish `dist/index.js`.
{
	"name": "foo",
	"exports": "./dist/index.js",
	"files": [
		"*.js"
	]
}
```

```json
// ✅ — a literal directory name publishes everything beneath it.
{
	"name": "foo",
	"exports": "./dist/index.js",
	"files": [
		"dist"
	]
}
```

```json
// ❌
{
	"name": "foo",
	"version": "1.0.0"
}
```

```json
// ✅
{
	"name": "foo",
	"files": [
		"dist"
	]
}
```
