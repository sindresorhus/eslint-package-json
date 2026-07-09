# prefer-files-field

📝 Require a `files` allowlist.

💼 This rule is enabled in the ✅ `recommended` [config](https://github.com/sindresorhus/eslint-package-json#configs).

<!-- end auto-generated rule header -->
<!-- Do not manually modify this header. Run: `npm run fix:eslint-docs` -->

Without a `files` allowlist, npm publishes everything not covered by `.npmignore`, which often leaks source, tests, and config into the published package. Declaring `files` makes the published contents explicit and minimal.

This rule reports a non-private package (`"private": true` is exempt) that has no `files` field.

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
