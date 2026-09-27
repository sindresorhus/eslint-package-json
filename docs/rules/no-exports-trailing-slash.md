# no-exports-trailing-slash

📝 Disallow trailing-slash folder mappings in `exports`/`imports`.

💼 This rule is enabled in the ✅ `recommended` [config](https://github.com/sindresorhus/eslint-package-json#configs).

💡 This rule is manually fixable by [editor suggestions](https://eslint.org/docs/latest/use/core-concepts#rule-suggestions).

<!-- end auto-generated rule header -->
<!-- Do not manually modify this header. Run: `npm run fix:eslint-docs` -->

Trailing-slash folder mappings in `exports` and `imports`, such as `"./foo/": "./dist/foo/"`, no longer work. Node.js deprecated them as [`DEP0148`](https://nodejs.org/api/deprecations.html#DEP0148) and removed them in v17, so importing through one now throws `ERR_PACKAGE_PATH_NOT_EXPORTED`. This rule reports trailing-slash keys and targets, and suggests converting a direct folder mapping to a `*` pattern. It is not an autofix, since it changes resolution: with `{"./foo/": "./lib/foo/", "./*": "./dist/*"}`, `pkg/foo/x.js` resolves to `./dist/foo/x.js` before and to `./lib/foo/x.js` after. No suggestion is offered when a sibling already has the pattern key. A folder target without a trailing-slash key, such as `"exports": "./dist/"`, is reported too. A target that is not a relative path, such as `lodash/`, is left to [`valid-fields`](valid-fields.md).

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
