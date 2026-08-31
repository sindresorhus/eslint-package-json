# no-incompatible-peer-dependency-ranges

📝 Disallow incompatible ranges for peer dependencies also listed as runtime dependencies.

💼 This rule is enabled in the ✅ `recommended` [config](https://github.com/sindresorhus/eslint-package-json#configs).

💡 This rule is manually fixable by [editor suggestions](https://eslint.org/docs/latest/use/core-concepts#rule-suggestions).

<!-- end auto-generated rule header -->

When a package appears in both `peerDependencies` and a runtime dependency group, the ranges must share at least one stable version. Disjoint ranges contradict the installed runtime requirement and advertised peer compatibility.

This rule checks `dependencies` and `optionalDependencies`. Compatibility with `devDependencies` is handled by [`peer-dependencies-as-dev-dependencies`](./peer-dependencies-as-dev-dependencies.md), which also ensures each required peer is installed for local development.

Only valid semver ranges are compared. Ranges that mention prerelease versions and non-semver specifiers such as dist-tags, `workspace:`, `file:`, git, and URLs are ignored.

When possible, suggestions can copy either range to the other declaration. Choose whether the installed version requirement or public compatibility contract is authoritative.

## Examples

```json
// ❌
{
	"peerDependencies": {
		"react": "^18.0.0"
	},
	"dependencies": {
		"react": "^19.0.0"
	}
}
```

```json
// ✅
{
	"peerDependencies": {
		"react": ">=18.0.0 <20.0.0"
	},
	"dependencies": {
		"react": "^19.0.0"
	}
}
```
