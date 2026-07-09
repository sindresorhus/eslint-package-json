# require-entry-point

📝 Require an entry point field.

💼 This rule is enabled in the ✅ `recommended` [config](https://github.com/sindresorhus/eslint-package-json#configs).

<!-- end auto-generated rule header -->
<!-- Do not manually modify this header. Run: `npm run fix:eslint-docs` -->

A published package needs an entry point so consumers can import or run it. If none of `exports`, `main`, or `bin` is defined, the package exposes nothing.

This rule reports a non-private package (`"private": true` is exempt) that defines no entry point. Types-only and side-effect-only packages are exceptions; disable the rule for those.

## Examples

```json
// ❌
{
	"name": "foo",
	"version": "1.0.0"
}
```

```json
// ✅
{
	"name": "foo",
	"exports": "./index.js"
}
```
