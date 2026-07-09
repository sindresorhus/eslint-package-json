# no-http-dependencies

📝 Disallow HTTP URLs as dependency specifiers.

💼 This rule is enabled in the ✅ `recommended` [config](https://github.com/sindresorhus/eslint-package-json#configs).

<!-- end auto-generated rule header -->
<!-- Do not manually modify this header. Run: `npm run fix:eslint-docs` -->

Remote `http(s)` tarball URLs as dependency specifiers are fragile: they bypass the npm registry, lack a version and integrity hash, and can change or disappear. Use a published registry version instead.

Git URLs (`git+https://…`) are handled by [`no-git-dependencies`](./no-git-dependencies.md), and local paths by [`no-local-dependencies`](./no-local-dependencies.md).

## Examples

```json
// ❌
{
	"dependencies": {
		"foo": "https://example.com/foo.tgz"
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
