# require-types-in-exports

📝 Require correctly ordered and module-compatible types in `exports`.

💼 This rule is enabled in the ✅ `recommended` [config](https://github.com/sindresorhus/eslint-package-json#configs).

<!-- end auto-generated rule header -->
<!-- Do not manually modify this header. Run: `npm run fix:eslint-docs` -->

When `exports` is present, modern TypeScript resolution reads types from it instead of the top-level `types` or `typings` field. For packages that declare type metadata, this rule requires coverage for each exported JavaScript branch, validates `types` and `types@…` ordering and selectors, and checks declaration extensions against matching JavaScript module formats.

This is static manifest analysis. Targets must be structurally valid, arrays use only their first entry, and nested declaration fallbacks are best effort. File existence, publication, declaration contents, overlapping version ranges, and custom TypeScript conditions are not checked. Use [`valid-fields`](valid-fields.md) for malformed targets and package-aware tools for published contents.

## Examples

```json
// ❌
{
	"types": "./index.d.ts",
	"exports": {
		"import": "./index.js",
		"require": "./index.cjs"
	}
}
```

```json
// ✅
{
	"types": "./index.d.ts",
	"exports": {
		"types": "./index.d.ts",
		"default": "./index.js"
	}
}
```
