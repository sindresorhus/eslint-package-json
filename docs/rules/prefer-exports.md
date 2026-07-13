# prefer-exports

📝 Prefer an `exports`-first package interface.

💼 This rule is enabled in the ✅ `recommended` [config](https://github.com/sindresorhus/eslint-package-json#configs).

<!-- end auto-generated rule header -->
<!-- Do not manually modify this header. Run: `npm run fix:eslint-docs` -->

The `exports` field supports multiple entry points, conditional resolution, and encapsulation. This rule reports the legacy `main`, `module`, `types`, and `typings` fields, plus string-valued `browser` entry points. Browser object mappings are ignored because their replacements and `false` shims have no generic `exports` equivalent.

When `exports` is present, modern TypeScript resolution reads types from it instead of the top-level `types` field. Rewriting entry points can change resolution, so this rule has no autofix.

## Examples

```json
// ❌
{
	"main": "./index.js",
	"types": "./index.d.ts"
}
```

```json
// ❌
{
	"exports": "./index.js",
	"main": "./index.js"
}
```

```json
// ✅
{
	"exports": {
		"types": "./index.d.ts",
		"default": "./index.js"
	}
}
```
