# require-types-in-exports

📝 Enforce that types are exposed through the `exports` field.

💼 This rule is enabled in the ✅ `recommended` [config](https://github.com/sindresorhus/eslint-package-json#configs).

<!-- end auto-generated rule header -->
<!-- Do not manually modify this header. Run: `npm run fix:eslint-docs` -->

When the `exports` field is present, TypeScript's `node16`/`nodenext` module resolution ignores the top-level `types`/`typings` field. Types must instead be exposed through a `types` condition inside `exports`, otherwise consumers using modern resolution will not find your type declarations.

This rule reports when the package ships types via a top-level `types`/`typings` field but no `types` condition appears anywhere in `exports`.

> [!NOTE]
> The legacy `node` and `bundler` resolution modes still read the top-level `types` field, so this only affects `node16`/`nodenext`. Keeping the top-level field as a fallback alongside the `exports` condition is fine.

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
