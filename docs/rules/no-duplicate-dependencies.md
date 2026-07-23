# no-duplicate-dependencies

📝 Disallow a dependency listed in multiple dependency groups.

💼 This rule is enabled in the ✅ `recommended` [config](https://github.com/sindresorhus/eslint-package-json#configs).

🔧💡 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix) and manually fixable by [editor suggestions](https://eslint.org/docs/latest/use/core-concepts#rule-suggestions).

<!-- end auto-generated rule header -->

A package cannot meaningfully appear in more than one of `dependencies`, `devDependencies`, and `optionalDependencies` at the same time. Doing so is contradictory and usually a mistake left over from moving a dependency between groups.

When both entries carry the same specifier the duplicate is pure redundancy, so it is removed automatically, keeping the one in the higher-priority group (`dependencies` over `devDependencies` over `optionalDependencies`).

When the specifiers differ, only a suggestion is offered. npm resolves the conflict to a single version, and not necessarily the one the group order implies — installing `{"dependencies": {"semver": "^7.0.0"}, "devDependencies": {"semver": "^6.0.0"}}` yields semver 6. Removing either entry therefore changes which version is installed, which is the author's call.

`peerDependencies` is intentionally excluded, since also listing a peer dependency in `devDependencies` is a common and valid pattern.

## Examples

```json
// ❌
{
	"dependencies": {
		"foo": "^1.0.0"
	},
	"devDependencies": {
		"foo": "^1.0.0"
	}
}
```

```json
// ✅
{
	"dependencies": {
		"foo": "^1.0.0"
	},
	"devDependencies": {
		"bar": "^1.0.0"
	}
}
```
