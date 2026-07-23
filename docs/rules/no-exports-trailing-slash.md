# no-exports-trailing-slash

📝 Disallow trailing-slash folder mappings in `exports`/`imports`.

💼 This rule is enabled in the ✅ `recommended` [config](https://github.com/sindresorhus/eslint-package-json#configs).

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->
<!-- Do not manually modify this header. Run: `npm run fix:eslint-docs` -->

Trailing-slash folder mappings in `exports` and `imports`, such as `"./foo/": "./dist/foo/"`, no longer work. Node.js deprecated them as [`DEP0148`](https://nodejs.org/api/deprecations.html#DEP0148) and removed them in v17, so importing through one now throws `ERR_PACKAGE_PATH_NOT_EXPORTED`. This rule reports trailing-slash keys and targets, and safely converts direct folder mappings to `*` patterns.

## Examples

```json
// ❌
{
	"exports": {
		"./foo/": "./dist/foo/"
	}
}
```

```json
// ❌
{
	"exports": {
		"./foo/*": "./dist/foo/"
	}
}
```

```json
// ✅
{
	"exports": {
		"./foo/*": "./dist/foo/*"
	}
}
```
