# no-backslash-paths

📝 Enforce forward slashes in path fields.

💼 This rule is enabled in the ✅ `recommended` [config](https://github.com/sindresorhus/eslint-package-json#configs).

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->
<!-- Do not manually modify this header. Run: `npm run fix:eslint-docs` -->

Paths in `package.json` must use forward slashes. Windows build tools sometimes emit backslashes (e.g. `".\\dist\\index.js"`), which resolve on Windows but break on Linux and macOS. Forward slashes work everywhere.

This rule flags backslashes in path fields (`main`, `module`, `browser`, `types`, `typings`, `bin`, `files`, and `exports`/`imports` targets) and autofixes them to forward slashes.

## Examples

```json
// ❌
{
	"main": ".\\dist\\index.js"
}
```

```json
// ✅
{
	"main": "./dist/index.js"
}
```
