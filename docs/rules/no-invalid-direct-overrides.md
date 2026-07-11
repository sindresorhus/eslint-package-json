# no-invalid-direct-overrides

📝 Disallow npm overrides that conflict with direct dependencies.

💼 This rule is enabled in the ✅ `recommended` [config](https://github.com/sindresorhus/eslint-package-json#configs).

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->
<!-- Do not manually modify this header. Run: `npm run fix:eslint-docs` -->

npm rejects an override for a direct dependency when its effective specifier differs from the dependency's specifier. It fails installation with an `EOVERRIDE` error.

Use the same specifier, or reference the direct dependency with `$dependency`. The latter keeps the override synchronized when the dependency is updated. This rule automatically converts invalid direct overrides to the `$dependency` form.

## Examples

```json
// ❌
{
	"dependencies": {
		"foo": "^1.0.0"
	},
	"overrides": {
		"foo": "^2.0.0"
	}
}
```

```json
// ✅
{
	"dependencies": {
		"foo": "^1.0.0"
	},
	"overrides": {
		"foo": "$foo"
	}
}
```
