# no-workspace-protocol-in-published-package

📝 Disallow `workspace:` dependency specifiers in packages that can be published.

💼 This rule is enabled in the ✅ `recommended` [config](https://github.com/sindresorhus/eslint-package-json#configs).

<!-- end auto-generated rule header -->
<!-- Do not manually modify this header. Run: `npm run fix:eslint-docs` -->

The `workspace:` protocol refers to another package in the current monorepo. npm workspaces record ordinary semver ranges for workspace dependencies, while Yarn and pnpm rewrite `workspace:` ranges when packing or publishing a package.

A package published without that rewrite exposes a dependency specifier that consumers cannot resolve. Use a normal semver range in packages that may be published, or ensure the release process rewrites the manifest before it is packed. Packages with `"private": true` are exempt because npm refuses to publish them.

See the [npm workspace documentation](https://docs.npmjs.com/cli/using-npm/workspaces/) and the [Yarn workspace protocol documentation](https://yarnpkg.com/features/workspaces).

## Examples

```json
// ❌
{
	"dependencies": {
		"@my-org/utils": "workspace:^"
	}
}
```

```json
// ✅
{
	"dependencies": {
		"@my-org/utils": "^1.2.3"
	}
}
```

```json
// ✅
{
	"private": true,
	"dependencies": {
		"@my-org/utils": "workspace:^"
	}
}
```
