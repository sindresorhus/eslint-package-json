# no-redundant-files

📝 Disallow redundant entries in the `files` field.

💼 This rule is enabled in the ✅ `recommended` [config](https://github.com/sindresorhus/eslint-package-json#configs).

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->

npm always includes certain files regardless of the [`files`](https://docs.npmjs.com/cli/configuring-npm/package-json#files) field: `package.json`, `README` (all variants), and `LICENSE`/`LICENCE` (all variants). Listing them explicitly is redundant and adds noise.

This rule also catches exact duplicate entries in the `files` array.

Always-included files (case-insensitive):

- `package.json`
- `README`, `README.*` (e.g., `README.md`)
- `LICENSE`, `LICENSE.*`, `LICENCE`, `LICENCE.*`

## Examples

```json
// ❌
{
	"files": [
		"src",
		"package.json",
		"README.md"
	]
}
```

```json
// ❌
{
	"files": [
		"src",
		"dist",
		"src"
	]
}
```

```json
// ✅
{
	"files": [
		"src",
		"dist"
	]
}
```
