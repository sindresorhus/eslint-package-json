# no-absolute-paths

📝 Disallow absolute paths in path fields.

💼 This rule is enabled in the ✅ `recommended` [config](https://github.com/sindresorhus/eslint-package-json#configs).

<!-- end auto-generated rule header -->
<!-- Do not manually modify this header. Run: `npm run fix:eslint-docs` -->

Path fields in `package.json` must be relative to the package. An absolute path (a POSIX root like `/Users/me/lib/index.js` or a Windows drive like `C:/lib/index.js`) only exists on the author's machine and breaks for everyone else.

This rule flags absolute paths in path fields (`main`, `module`, `browser`, `types`, `typings`, `bin`, `files`, and `exports`/`imports` targets). URLs are ignored.

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
