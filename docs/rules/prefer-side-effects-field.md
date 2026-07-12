# prefer-side-effects-field

📝 Recommend declaring the `sideEffects` field for packages with an `exports` field and bundler conditions in `exports` or `imports`.

💼 This rule is enabled in the ✅ `recommended` [config](https://github.com/sindresorhus/eslint-package-json#configs).

<!-- end auto-generated rule header -->
<!-- Do not manually modify this header. Run: `npm run fix:eslint-docs` -->

Bundlers can remove unused modules more aggressively when a package declares which files have import-time side effects. The `sideEffects` field is optional and is not required by npm.

This rule reports when `sideEffects` is missing and the package has an `exports` field with a nested `module` or `browser` condition in `exports` or `imports`.

Top-level `main`, `module`, and `browser` fields do not trigger this rule. An `imports` condition without an `exports` field does not trigger it either.

The rule cannot determine whether a package is actually side-effect-free. Audit all importable files before using `false`, including CSS imports, polyfills, global registrations, and prototype modifications. If only some files have side effects, list them instead. Existing `sideEffects` values, including invalid ones, are left to [`valid-fields`](valid-fields.md).

Private packages are included because workspace packages can still be consumed by bundlers.

## Examples

```json
// ❌
{
	"name": "my-package",
	"exports": {
		"module": "./dist/index.js"
	}
}
```

```json
// ✅
{
	"name": "my-package",
	"exports": {
		"module": "./dist/index.js"
	},
	"sideEffects": false
}
```

```json
// ❌
{
	"name": "my-package",
	"exports": {
		"browser": "./dist/browser.js"
	}
}
```

```json
// ✅
{
	"name": "my-package",
	"exports": {
		"browser": "./dist/browser.js"
	},
	"sideEffects": [
		"*.css",
		"./dist/polyfills.js"
	]
}
```

```json
// ✅
{
	"name": "my-package",
	"exports": "./index.js"
}
```
