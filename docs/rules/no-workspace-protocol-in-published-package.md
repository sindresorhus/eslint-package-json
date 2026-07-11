# no-workspace-protocol-in-published-package

📝 Disallow `workspace:` dependency specifiers in packages that can be published.

💼 This rule is enabled in the ✅ `recommended` [config](https://github.com/sindresorhus/eslint-package-json#configs).

<!-- end auto-generated rule header -->
<!-- Do not manually modify this header. Run: `npm run fix:eslint-docs` -->

The `workspace:` protocol refers to another package in the current monorepo. npm workspaces record ordinary semver ranges for workspace dependencies. Yarn rewrites `workspace:` ranges when publishing, and pnpm rewrites them when packing or publishing.

This rule checks source `package.json` files, so it requires a normal semver range in every package that can be published, even if release tooling could rewrite the range. Projects that intentionally rely on that rewrite should disable this rule for those source manifests. Packages with `"private": true` are exempt because npm refuses to publish them.

See the [npm workspace documentation](https://docs.npmjs.com/cli/using-npm/workspaces/), [Yarn workspace protocol documentation](https://yarnpkg.com/features/workspaces), and [pnpm workspace documentation](https://pnpm.io/workspaces#publishing-workspace-packages).

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
