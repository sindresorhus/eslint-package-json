# require-types-in-exports

📝 Enforce that types are exposed through the `exports` field.

💼 This rule is enabled in the ✅ `recommended` [config](https://github.com/sindresorhus/eslint-package-json#configs).

<!-- end auto-generated rule header -->
<!-- Do not manually modify this header. Run: `npm run fix:eslint-docs` -->

When TypeScript resolves a package through `exports`, its `node16`, `nodenext`, and `bundler` module resolution modes ignore the top-level `types`/`typings` field. TypeScript can infer a declaration file from a JavaScript export target through extension substitution, but a `types` condition declares the package's type entry point explicitly.

This rule reports when the package ships types via a top-level `types`/`typings` field but no `types` condition appears anywhere in `exports`. It enforces explicit type entry points rather than relying on extension substitution.

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
