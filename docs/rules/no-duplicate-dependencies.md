# no-duplicate-dependencies

📝 Disallow a dependency listed in multiple dependency groups.

💼 This rule is enabled in the ✅ `recommended` [config](https://github.com/sindresorhus/eslint-package-json#configs).

🔧💡 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix) and manually fixable by [editor suggestions](https://eslint.org/docs/latest/use/core-concepts#rule-suggestions).

<!-- end auto-generated rule header -->

A package cannot meaningfully appear in more than one of `dependencies`, `devDependencies`, and `optionalDependencies` at the same time. Doing so is contradictory and usually a mistake left over from moving a dependency between groups.

The suggestion removes the entry from the group a consumer does not install from: `optionalDependencies` wins over `dependencies`, which wins over `devDependencies`, so `fsevents` stays optional. It is a suggestion even when the specifiers match, since `npm install --omit=dev` in the project skips a name that is also in `devDependencies`. A duplicate within one group is autofixed when the specifiers match.

When a `dependencies` and a `devDependencies` entry differ, the project and its consumers install different versions: with `{"dependencies": {"semver": "^7.0.0"}, "devDependencies": {"semver": "^6.0.0"}}`, the project gets semver 6 and a consumer gets semver 7. Which entry to remove is the author's call.

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
	}
}
```
