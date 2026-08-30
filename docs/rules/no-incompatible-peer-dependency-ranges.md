# no-incompatible-peer-dependency-ranges

📝 Disallow incompatible ranges for peer dependencies also listed as runtime dependencies.

💼 This rule is enabled in the ✅ `recommended` [config](https://github.com/sindresorhus/eslint-package-json#configs).

💡 This rule is manually fixable by [editor suggestions](https://eslint.org/docs/latest/use/core-concepts#rule-suggestions).

<!-- end auto-generated rule header -->

When a package appears in both `peerDependencies` and a runtime dependency group, the ranges should share at least one stable version. Disjoint ranges encode contradictory runtime requirements and advertised host compatibility, usually indicating that one declaration was not updated when supported versions changed.

This rule checks `dependencies` and `optionalDependencies`. Compatibility with `devDependencies` is handled by [`peer-dependencies-as-dev-dependencies`](./peer-dependencies-as-dev-dependencies.md), which also ensures each required peer is installed for local development.

Only valid semver ranges are compared. Ranges that explicitly mention prerelease versions are ignored because prerelease admission is tuple-specific and cannot be accurately determined by a general range-intersection check. Dist-tags and `workspace:`, `file:`, git, URL, and other non-semver specifiers are also ignored because they do not describe ranges that can be intersected.

The rule offers whichever of two suggestions would produce a satisfiable declaration: use the peer range for the runtime dependency, or use the runtime range for the peer dependency. Choose based on whether the installed version requirement or the public compatibility contract is authoritative.

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
