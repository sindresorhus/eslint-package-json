# require-engines

📝 Require the `engines.node` field.

💼 This rule is enabled in the ✅ `recommended` [config](https://github.com/sindresorhus/eslint-package-json#configs).

<!-- end auto-generated rule header -->
<!-- Do not manually modify this header. Run: `npm run fix:eslint-docs` -->

Declaring `engines.node` tells consumers (and package managers) which Node.js versions your package supports, so an incompatible install can warn or fail early instead of breaking at runtime.

This rule reports a package that has no `engines.node` entry.

## Examples

```json
// ❌
{
	"name": "foo"
}
```

```json
// ❌
{
	"engines": {
		"npm": ">=10"
	}
}
```

```json
// ✅
{
	"engines": {
		"node": ">=20"
	}
}
```
