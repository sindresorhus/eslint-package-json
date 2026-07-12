# require-types-in-exports

📝 Require correctly ordered and module-compatible types in `exports`.

💼 This rule is enabled in the ✅ `recommended` [config](https://github.com/sindresorhus/eslint-package-json#configs).

<!-- end auto-generated rule header -->
<!-- Do not manually modify this header. Run: `npm run fix:eslint-docs` -->

When the `exports` field is present, TypeScript's `node16`/`nodenext` module resolution ignores the top-level `types`/`typings` field. Types must instead be exposed through a `types` condition inside `exports`, otherwise consumers using modern resolution will not find your type declarations.

This rule checks type conditions when the package declares types through a top-level `types`/`typings` field or inside `exports`. It supports versioned conditions such as `types@>=5`, requires all type conditions to precede runtime conditions, and requires each known exported JavaScript branch to have corresponding type coverage.

It also performs static checks that type targets use `.d.ts`, `.d.mts`, or `.d.cts`, and that those extensions agree with known `.mjs`, `.cjs`, and package-`type` formats. It does not check whether declaration files exist, are published, or contain matching declarations. Use package-aware tools for those checks.

> [!NOTE]
> The legacy `node` and `bundler` resolution modes still read the top-level `types` field, so this is primarily important for `node16`/`nodenext`. Keeping the top-level field as a fallback alongside the `exports` condition is fine.

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
