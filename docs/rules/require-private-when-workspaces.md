# require-private-when-workspaces

📝 Require `private` when `workspaces` is set.

💼 This rule is enabled in the ✅ `recommended` [config](https://github.com/sindresorhus/eslint-package-json#configs).

💡 This rule is manually fixable by [editor suggestions](https://eslint.org/docs/latest/use/core-concepts#rule-suggestions).

<!-- end auto-generated rule header -->
<!-- Do not manually modify this header. Run: `npm run fix:eslint-docs` -->

A package that declares `workspaces` is a monorepo root. Such a root is almost never meant to be published, so it should set `"private": true` to prevent an accidental `npm publish` of the workspace root.

## Examples

```json
// ❌
{
	"name": "my-monorepo",
	"workspaces": [
		"packages/*"
	]
}
```

```json
// ✅
{
	"name": "my-monorepo",
	"private": true,
	"workspaces": [
		"packages/*"
	]
}
```
