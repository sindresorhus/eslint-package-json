# require-default-condition

📝 Require a last `default` entry in `exports`/`imports` conditions objects.

💼 This rule is enabled in the ✅ `recommended` [config](https://github.com/sindresorhus/eslint-package-json#configs).

<!-- end auto-generated rule header -->
<!-- Do not manually modify this header. Run: `npm run fix:eslint-docs` -->

Conditions are resolved top to bottom. This rule requires each conditions object in `exports` and `imports` to end with a `default` fallback.

A nested conditions object needs no `default` when a later `default` in an enclosing object covers it, as in `{"node": {"import": "./a.mjs"}, "default": "./a.js"}`, since Node moves on to the next key when the nested object matches nothing. Likewise, only the last element of a fallback array needs its own `default`.

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
