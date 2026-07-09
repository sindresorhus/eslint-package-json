# no-duplicate-dependencies

📝 Disallow a dependency listed in multiple dependency groups.

💼 This rule is enabled in the ✅ `recommended` [config](https://github.com/sindresorhus/eslint-package-json#configs).

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->

A package cannot meaningfully appear in more than one of `dependencies`, `devDependencies`, and `optionalDependencies` at the same time. Doing so is contradictory and usually a mistake left over from moving a dependency between groups. The duplicate entry is autofixed by removing it, keeping the one in the higher-priority group (`dependencies` over `devDependencies` over `optionalDependencies`).

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
