# prefer-files-field

📝 Require a `files` allowlist that covers published entry points.

💼 This rule is enabled in the ✅ `recommended` [config](https://github.com/sindresorhus/eslint-package-json#configs).

<!-- end auto-generated rule header -->
<!-- Do not manually modify this header. Run: `npm run fix:eslint-docs` -->

This rule requires non-private packages to declare a `files` allowlist and reports entry points definitely omitted by simple paths, directories, or globs. It skips negated or ambiguous patterns and accounts for npm automatically including `main` and `bin`.

Run `npm pack --dry-run` to verify the actual tarball, including `.npmignore` and filesystem contents.

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
