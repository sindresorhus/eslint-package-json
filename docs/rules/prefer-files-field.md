# prefer-files-field

📝 Require a `files` allowlist that covers published entry points.

💼 This rule is enabled in the ✅ `recommended` [config](https://github.com/sindresorhus/eslint-package-json#configs).

<!-- end auto-generated rule header -->
<!-- Do not manually modify this header. Run: `npm run fix:eslint-docs` -->

Without a `files` allowlist, npm publishes everything not covered by `.npmignore`, which often leaks source, tests, and config into the published package. Declaring `files` makes the published contents explicit and minimal.

This rule reports a non-private package (`"private": true` is exempt) that has no `files` field. When the field is present, it also reports definite omissions for simple exact paths, directories, and globs used by published entry points. It skips negated and ambiguous patterns, and treats npm's automatic inclusion of `main` and `bin` targets as covered.

This is a conservative manifest-only check. Run `npm pack --dry-run` to verify the actual tarball, including `.npmignore`, npm's automatic inclusions, and filesystem existence.

## Examples

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
