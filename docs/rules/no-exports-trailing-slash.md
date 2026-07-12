# no-exports-trailing-slash

📝 Disallow deprecated trailing-slash folder mappings in `exports`/`imports`.

💼 This rule is enabled in the ✅ `recommended` [config](https://github.com/sindresorhus/eslint-package-json#configs).

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->
<!-- Do not manually modify this header. Run: `npm run fix:eslint-docs` -->

Mapping a subpath that ends in `/` to a folder in `exports`/`imports` (for example `"./foo/": "./dist/foo/"`) is deprecated. Node.js emits [`DEP0148`](https://nodejs.org/api/deprecations.html#DEP0148) for it. Use a subpath pattern with `*` instead, which explicitly captures the rest of the path and resolves the exact same set of paths. This rule flags both trailing-slash subpath keys and trailing-slash string targets. It only autofixes a direct folder mapping where changing both sides to `*` preserves the mapping; other targets are reported without an autofix.

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
