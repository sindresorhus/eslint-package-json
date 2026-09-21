# no-node-modules-bin-paths

📝 Disallow direct `node_modules/.bin` paths in scripts.

💼 This rule is enabled in the ✅ `recommended` [config](https://github.com/sindresorhus/eslint-package-json#configs).

💡 This rule is manually fixable by [editor suggestions](https://eslint.org/docs/latest/use/core-concepts#rule-suggestions).

<!-- end auto-generated rule header -->
<!-- Do not manually modify this header. Run: `npm run fix:eslint-docs` -->

[npm adds local binaries to `PATH`](https://docs.npmjs.com/cli/v11/using-npm/scripts/#path) in package scripts. Use `eslint` instead of `node_modules/.bin/eslint` or `./node_modules/.bin/eslint`.

Checks direct commands in `scripts`, including command chains and commands after environment assignments, with quoted paths and Windows path separators. Ignores path arguments, assignment values, and paths to other installations.

Detection is limited to simple shell commands. Wrappers, leading redirections, nested shell strings, variable expansion, and compound shell syntax are unsupported.

Suggestions preserve arguments and quoting. There is no autofix because changes to `PATH` or the working directory can make a binary name resolve to a different executable.

## Examples

```json
// ❌
{
	"scripts": {
		"lint": "./node_modules/.bin/eslint .",
		"test": "NODE_ENV=test node_modules/.bin/jest && node_modules/.bin/eslint ."
	}
}
```

```json
// ✅
{
	"scripts": {
		"lint": "eslint .",
		"test": "NODE_ENV=test jest && eslint ."
	}
}
```
