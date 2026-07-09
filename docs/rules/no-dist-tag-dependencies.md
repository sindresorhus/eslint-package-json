# no-dist-tag-dependencies

📝 Disallow dist-tags as dependency specifiers.

💼 This rule is enabled in the ✅ `recommended` [config](https://github.com/sindresorhus/eslint-package-json#configs).

<!-- end auto-generated rule header -->
<!-- Do not manually modify this header. Run: `npm run fix:eslint-docs` -->

A dependency pinned to a dist-tag (`latest`, `next`, `beta`, `canary`, …) resolves to a different version over time, so installs are not reproducible and an unexpected release can land without a `package.json` change. Pin a version range instead.

This rule flags bare dist-tag specifiers. Version ranges, wildcards (handled by [`no-wildcard-dependencies`](no-wildcard-dependencies.md)), `workspace:`/`file:`/`npm:`/git protocols, and `user/repo` shorthands are not flagged.

## Examples

```json
// ❌
{
	"dependencies": {
		"foo": "latest"
	}
}
```

```json
// ✅
{
	"dependencies": {
		"foo": "^1.0.0"
	}
}
```
