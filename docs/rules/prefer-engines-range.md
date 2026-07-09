# prefer-engines-range

📝 Prefer open-ended `>=` ranges in the `engines` field.

💼 This rule is enabled in the ✅ `recommended` [config](https://github.com/sindresorhus/eslint-package-json#configs).

💡 This rule is manually fixable by [editor suggestions](https://eslint.org/docs/latest/use/core-concepts#rule-suggestions).

<!-- end auto-generated rule header -->
<!-- Do not manually modify this header. Run: `npm run fix:eslint-docs` -->

The `engines` field declares which runtime versions a package supports. A caret, tilde, or exact version implies an unintended upper bound: `"node": "^18"` means `>=18 <19`, so it excludes Node.js 20 and later even though the package almost certainly runs there. An open-ended `>=` range states the actual minimum without falsely capping the maximum.

This rule reports caret (`^`), tilde (`~`), and exact-version `engines` ranges and suggests the equivalent `>=` range. Bare major ranges (e.g. `"18"`) and existing `>=` ranges are left alone.

It offers a suggestion rather than an autofix, since widening the range changes the declared compatibility.

## Examples

```json
// ❌
{
	"engines": {
		"node": "^18.0.0"
	}
}
```

```json
// ❌
{
	"engines": {
		"node": "18.0.0"
	}
}
```

```json
// ✅
{
	"engines": {
		"node": ">=18"
	}
}
```
