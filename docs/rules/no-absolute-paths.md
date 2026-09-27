# no-absolute-paths

📝 Disallow absolute paths in path fields.

💼 This rule is enabled in the ✅ `recommended` [config](https://github.com/sindresorhus/eslint-package-json#configs).

💡 This rule is manually fixable by [editor suggestions](https://eslint.org/docs/latest/use/core-concepts#rule-suggestions).

<!-- end auto-generated rule header -->
<!-- Do not manually modify this header. Run: `npm run fix:eslint-docs` -->

Path fields in `package.json` must be relative to the package. An absolute path (a POSIX root like `/Users/me/lib/index.js` or a Windows drive like `C:/lib/index.js`) only exists on the author's machine and breaks for everyone else.

This rule flags absolute paths in path fields (`main`, `module`, `browser`, `types`, `typings`, `bin`, `man`, and `files`). URLs are ignored. `exports` and `imports` targets are left to [`valid-fields`](valid-fields.md).

A leading `/` in `files` is the one exception: npm strips it, so `"/dist"` publishes what `"dist"` does. It is reported as redundant, with a suggestion to drop it (a file npm always includes, such as `/LICENSE`, is left to [`no-redundant-files`](no-redundant-files.md)). npm strips only one leading `./` or `/`, so `//dist` and `.//dist` are reported as absolute, as is a Windows drive.

## Examples

```json
// ❌
{
	"main": "/Users/me/project/index.js"
}
```

```json
// ✅
{
	"main": "./index.js"
}
```

```json
// ❌ — the slash is redundant; `files` patterns already start at the package root.
{
	"files": [
		"/dist"
	]
}
```

```json
// ✅
{
	"files": [
		"dist"
	]
}
```
