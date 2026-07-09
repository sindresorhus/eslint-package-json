# prefer-provenance

📝 Enforce npm provenance via `publishConfig.provenance`.

💡 This rule is manually fixable by [editor suggestions](https://eslint.org/docs/latest/use/core-concepts#rule-suggestions).

<!-- end auto-generated rule header -->

Encourage enabling [npm provenance](https://docs.npmjs.com/generating-provenance-statements) for published packages.

When a `publishConfig` object is present, this rule checks that `provenance` is set to `true`. Private packages (`"private": true`) are skipped entirely.

The rule does not report when `publishConfig` is absent, as inserting a whole new block is outside the rule's scope. Add `publishConfig` manually and let the rule guide its contents.

## Examples

```json
// ❌
{
	"publishConfig": {}
}
```

```json
// ❌
{
	"publishConfig": {
		"provenance": false
	}
}
```

```json
// ✅
{
	"publishConfig": {
		"provenance": true
	}
}
```
