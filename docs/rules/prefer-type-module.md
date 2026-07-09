# prefer-type-module

📝 Enforce the `type` field to be `module`.

💼 This rule is enabled in the ✅ `recommended` [config](https://github.com/sindresorhus/eslint-package-json#configs).

💡 This rule is manually fixable by [editor suggestions](https://eslint.org/docs/latest/use/core-concepts#rule-suggestions).

<!-- end auto-generated rule header -->
<!-- Do not manually modify this header. Run: `npm run fix:eslint-docs` -->

Enforce that the package is an ES module by setting `"type": "module"`. This rule reports any value other than `"module"`, including a missing `type` (which defaults to `commonjs`), so new packages are ESM by default.

It offers a suggestion, not an autofix: switching to ES modules also requires updating the package's code, so it is opt-in.

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
