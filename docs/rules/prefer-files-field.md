# prefer-files-field

📝 Require a `files` allowlist that covers published entry points.

💼 This rule is enabled in the ✅ `recommended` [config](https://github.com/sindresorhus/eslint-package-json#configs).

<!-- end auto-generated rule header -->
<!-- Do not manually modify this header. Run: `npm run fix:eslint-docs` -->

This rule requires non-private packages to declare a `files` allowlist and reports entry points definitely omitted by simple paths, directories, or globs. It skips negated or ambiguous patterns and accounts for npm automatically including `main` and `bin`.

Matching follows npm's own `files` semantics, which are stricter than they look:

- Patterns are rooted at the package directory, so `*.js` publishes `index.js` but not `lib/index.js`. A leading `./` or `/` is stripped, making `dist`, `./dist`, and `/dist` the same entry.
- A single `*` never crosses a path separator, so `*/*.js` publishes `lib/a.js` but not `lib/nested/a.js`. Use `**` to cross separators.
- npm expands directories matched by wildcard patterns too. Both `dist` and `d*` publish everything beneath the matching directory.

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
