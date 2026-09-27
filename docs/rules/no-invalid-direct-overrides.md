# no-invalid-direct-overrides

📝 Disallow npm overrides that conflict with direct dependencies.

💼 This rule is enabled in the ✅ `recommended` [config](https://github.com/sindresorhus/eslint-package-json#configs).

💡 This rule is manually fixable by [editor suggestions](https://eslint.org/docs/latest/use/core-concepts#rule-suggestions).

<!-- end auto-generated rule header -->
<!-- Do not manually modify this header. Run: `npm run fix:eslint-docs` -->

npm rejects an override for a direct dependency when its effective specifier differs from the dependency's specifier. It fails installation with an `EOVERRIDE` error.

Use the same specifier, or reference the direct dependency with `$dependency`. The latter keeps the override synchronized when the dependency is updated. The rule suggests the `$dependency` form rather than autofixing it, since that drops the version the override forces on transitive copies, often a security fix. Raising the direct dependency's range may be the better fix. A `$name` reference with no non-empty specifier in any dependency group is reported without a suggestion, since npm fails with `Unable to resolve reference $name`.

`workspace:` direct dependencies are checked too. An override keyed by a range (`a@1.x`) is reported only when the range intersects the direct specifier.

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
