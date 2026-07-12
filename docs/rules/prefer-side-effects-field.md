# prefer-side-effects-field

📝 Recommend declaring the `sideEffects` field for packages.

💼 This rule is enabled in the ✅ `recommended` [config](https://github.com/sindresorhus/eslint-package-json#configs).

💡 This rule is manually fixable by [editor suggestions](https://eslint.org/docs/latest/use/core-concepts#rule-suggestions).

<!-- end auto-generated rule header -->
<!-- Do not manually modify this header. Run: `npm run fix:eslint-docs` -->

The optional `sideEffects` field tells bundlers whether files have import-time effects. Setting it to `false` or a precise array can enable more aggressive tree-shaking. npm does not require it.

This rule reports when `sideEffects` is missing and `exports` exists, regardless of its shape or condition names. Top-level `main`, `module`, and `browser` fields, and `imports` without `exports`, are ignored.

The rule suggests both `false` and `true` but cannot infer a safe value. Use `true` if import-time behavior has not been audited. Setting `false` asserts that all importable files are side-effect-free, so audit CSS, polyfills, global registrations, prototype modifications, and other import-time behavior first. Use an array of file globs when only some files have side effects. Existing values, including invalid ones, are handled by [`valid-fields`](valid-fields.md).

Private packages are included because workspace packages can still be consumed by bundlers.

## Examples

```json
// ❌
{
	"name": "my-package",
	"exports": {
		"default": "./dist/index.js"
	}
}
```

```json
// ✅
{
	"name": "my-package",
	"exports": {
		"default": "./dist/index.js"
	},
	"sideEffects": false
}
```

```json
// ❌
{
	"name": "my-package",
	"exports": {
		".": "./dist/index.js",
		"./browser": "./dist/browser.js"
	}
}
```

```json
// ✅
{
	"name": "my-package",
	"exports": {
		".": "./dist/index.js",
		"./browser": "./dist/browser.js"
	},
	"sideEffects": [
		"*.css",
		"./dist/polyfills.js"
	]
}
```
