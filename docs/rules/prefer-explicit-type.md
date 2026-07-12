# prefer-explicit-type

📝 Require an explicit `type` field.

💼 This rule is enabled in the ✅ `recommended` [config](https://github.com/sindresorhus/eslint-package-json#configs).

<!-- end auto-generated rule header -->
<!-- Do not manually modify this header. Run: `npm run fix:eslint-docs` -->

Node determines whether `.js` files are CommonJS or ES modules from the nearest package `type` field. Declaring the field makes that module format explicit and avoids relying on the default.

Use [`prefer-type-module`](prefer-type-module.md) when the project also wants the stylistic preference for ES modules. Invalid `type` values are handled by [`valid-fields`](valid-fields.md).

## Examples

```json
// ❌
{
	"name": "foo"
}
```

```json
// ✅
{
	"name": "foo",
	"type": "commonjs"
}
```
