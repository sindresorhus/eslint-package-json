# peer-dependencies-as-dev-dependencies

📝 Enforce peer dependencies to also be listed in `devDependencies` at a compatible version.

💼 This rule is enabled in the ✅ `recommended` [config](https://github.com/sindresorhus/eslint-package-json#configs).

💡 This rule is manually fixable by [editor suggestions](https://eslint.org/docs/latest/use/core-concepts#rule-suggestions).

<!-- end auto-generated rule header -->

Every package listed in `peerDependencies` should also appear in `devDependencies`. npm installs a missing peer at whatever version resolves that day, so a `devDependencies` entry pins the version you test against, and keeps it installed with `legacy-peer-deps` or package managers that skip peers, such as Yarn. A peer that is also in `dependencies` or `optionalDependencies` is exempt.

When a peer dependency is also in `devDependencies`, the development version range should overlap the peer range, so that you develop and test against a version you actually claim to support.

A peer marked `optional: true` in [`peerDependenciesMeta`](https://docs.npmjs.com/cli/configuring-npm/package-json#peerdependenciesmeta) is exempt from the missing-`devDependencies` check, since you may not want to (or be able to) develop against every optional peer at once. If you do add an optional peer to `devDependencies` anyway, its range is still checked against the peer range.

This rule offers a suggestion for both cases: adding the missing `devDependencies` entry, or aligning its range to the peer range.

## Examples

```json
// ❌
{
	"peerDependencies": {
		"react": "^18.0.0"
	}
}
```

```json
// ❌
{
	"peerDependencies": {
		"react": "^18.0.0"
	},
	"devDependencies": {
		"react": "^17.0.0"
	}
}
```

```json
// ✅
{
	"peerDependencies": {
		"react": "^18.0.0"
	},
	"devDependencies": {
		"react": "^18.0.0"
	}
}
```

```json
// ✅
{
	"peerDependencies": {
		"react": "^18.0.0"
	},
	"peerDependenciesMeta": {
		"react": {
			"optional": true
		}
	}
}
```
