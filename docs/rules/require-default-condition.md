# require-default-condition

📝 Require a last `default` entry in `exports`/`imports` conditions objects.

💼 This rule is enabled in the ✅ `recommended` [config](https://github.com/sindresorhus/eslint-package-json#configs).

<!-- end auto-generated rule header -->
<!-- Do not manually modify this header. Run: `npm run fix:eslint-docs` -->

A conditions object in `exports`/`imports` is resolved top to bottom, and the first matching condition wins. Without a `default` entry as the final fallback, resolution yields nothing when no listed condition matches the environment, which silently breaks the import.

This rule reports any conditions object that has no `default` entry or places `default` before another condition. The `default` condition is the final fallback and must be last.

> [!NOTE]
> Some packages deliberately omit `default` so that resolution fails for unsupported platforms. Disable the rule for those cases.

## Examples

```json
// ❌
{
	"exports": {
		"types": "./index.d.ts",
		"import": "./index.js"
	}
}
```

```json
// ❌
{
	"exports": {
		"default": "./index.cjs",
		"import": "./index.mjs"
	}
}
```

```json
// ✅
{
	"exports": {
		"types": "./index.d.ts",
		"import": "./index.js",
		"default": "./index.cjs"
	}
}
```
