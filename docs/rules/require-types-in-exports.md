# require-types-in-exports

📝 Require correctly ordered and module-compatible types in `exports`.

💼 This rule is enabled in the ✅ `recommended` [config](https://github.com/sindresorhus/eslint-package-json#configs).

<!-- end auto-generated rule header -->
<!-- Do not manually modify this header. Run: `npm run fix:eslint-docs` -->

By default, when the `exports` field is present, TypeScript's `node16`/`nodenext`/`bundler` module resolution ignores the top-level `types`/`typings` field. Types must instead be exposed through a `types` condition inside `exports`, otherwise consumers using modern resolution will not find your type declarations.

This rule checks type conditions when the package declares types through a top-level `types`/`typings` field or inside `exports`. It supports versioned conditions such as `types@>=5`, requires their selectors to use TypeScript-compatible semver syntax, requires versioned type conditions to precede the unversioned `types` fallback, requires all type conditions to precede runtime conditions, and requires each known exported JavaScript branch to have corresponding type coverage.

It also performs static checks that type targets use `.d.ts`, `.d.mts`, or `.d.cts`, and that those extensions agree with structurally matching `.mjs`, `.cjs`, and package-`type` formats. It does not simulate the complete set of simultaneously active conditions or custom TypeScript conditions. For target arrays, only the first entry is checked. The rule does not check whether declaration files exist, are published, or contain matching declarations. Use package-aware tools for those checks.

> [!NOTE]
> The legacy `node10` resolution mode, formerly named `node`, still reads the top-level `types` field. Keeping the top-level field as a fallback alongside the `exports` condition is fine.

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
