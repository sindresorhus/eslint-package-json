# no-manual-maintainers

📝 Disallow a manually-set `maintainers` field.

💼 This rule is enabled in the ✅ `recommended` [config](https://github.com/sindresorhus/eslint-package-json#configs).

💡 This rule is manually fixable by [editor suggestions](https://eslint.org/docs/latest/use/core-concepts#rule-suggestions).

<!-- end auto-generated rule header -->
<!-- Do not manually modify this header. Run: `npm run fix:eslint-docs` -->

npm populates the `maintainers` field from the publishing account (and the `npm owner` list) at publish time, overwriting whatever you put in `package.json`. Hand-maintaining it is therefore pointless and misleading. Use `author` and `contributors` to credit people, and `npm owner` to manage who can publish.

When `maintainers` is an array, a suggestion is offered to move its entries into `contributors` (merging with an existing `contributors` array, or renaming the field if there is none) instead of just removing them.

## Examples

```json
// ❌
{
	"maintainers": [
		"Jane Doe <jane@example.com>"
	]
}
```

```json
// ✅
{
	"author": "Jane Doe <jane@example.com>"
}
```
