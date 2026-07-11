# sort-files

📝 Enforce a canonical order for entries in the `files` field.

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->
<!-- Do not manually modify this header. Run: `npm run fix:eslint-docs` -->

Keeping the `files` allowlist in a predictable order makes it easier to verify what a package publishes.

This rule puts exact paths referenced by `exports`, top-level entry-point fields, and `bin` first. It then groups the remaining paths, directories, and glob patterns by path stem, keeping runtime files before their `.d.ts`, `.d.mts`, or `.d.cts` declarations.

The rule intentionally skips a `files` array containing a `!` negation. npm applies negations in sequence, so changing their order could change the package contents.

## Examples

```json
// ❌
{
	"exports": {
		"types": "./index.d.ts",
		"default": "./index.js"
	},
	"bin": "./cli.js",
	"files": [
		"assets",
		"cli.js",
		"index.d.ts",
		"index.js"
	]
}
```

```json
// ✅
{
	"exports": {
		"types": "./index.d.ts",
		"default": "./index.js"
	},
	"bin": "./cli.js",
	"files": [
		"index.js",
		"index.d.ts",
		"cli.js",
		"assets"
	]
}
```

```json
// ❌
{
	"files": [
		"dist/*.d.ts",
		"dist/*.js"
	]
}
```

```json
// ✅
{
	"files": [
		"dist/*.js",
		"dist/*.d.ts"
	]
}
```
