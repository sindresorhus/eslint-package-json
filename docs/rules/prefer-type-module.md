# prefer-type-module

📝 Prefer the `type` field to be `module`.

💡 This rule is manually fixable by [editor suggestions](https://eslint.org/docs/latest/use/core-concepts#rule-suggestions).

<!-- end auto-generated rule header -->
<!-- Do not manually modify this header. Run: `npm run fix:eslint-docs` -->

Prefer that the package is an ES module by setting `"type": "module"`. This opt-in rule reports an explicit `"type": "commonjs"` value. A missing `type` field is allowed, and malformed values are handled by [`valid-fields`](valid-fields.md).

It offers a suggestion, not an autofix: switching to ES modules also requires updating the package's code, so it is opt-in.

## Examples

```json
// ❌
{
	"type": "commonjs"
}
```

```json
// ✅
{
	"type": "module"
}
```
