# prefer-type-module

📝 Prefer the `type` field to be `module`.

💼 This rule is enabled in the ✅ `recommended` [config](https://github.com/sindresorhus/eslint-package-json#configs).

💡 This rule is manually fixable by [editor suggestions](https://eslint.org/docs/latest/use/core-concepts#rule-suggestions).

<!-- end auto-generated rule header -->
<!-- Do not manually modify this header. Run: `npm run fix:eslint-docs` -->

Prefer ES modules by reporting a missing `type` field or an explicit `"type": "commonjs"`. Invalid values are handled by other validation rules, and conversion is only suggested because it may require code changes.

## Examples

```json
// ❌
{
	"type": "commonjs"
}
```

```json
// ❌
{
	"name": "foo"
}
```

```json
// ✅
{
	"type": "module"
}
```
