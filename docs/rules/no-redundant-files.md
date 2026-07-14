# no-redundant-files

📝 Disallow redundant entries in the `files` field.

💼 This rule is enabled in the ✅ `recommended` [config](https://github.com/sindresorhus/eslint-package-json#configs).

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->

npm always includes `package.json`, readme, license, copying, and package entry-point files. This rule reports redundant always-included entries, duplicates, and ineffective negations.

`files` patterns are applied in order. A negation is reported when no earlier literal or universal pattern can cover it. Ambiguous glob overlap is ignored, and the rule does not inspect the filesystem.

Always-included names (case-insensitive):

- `package.json`
- `README`, `README.*` (e.g., `README.md`)
- `COPYING`, `COPYING.*`
- `LICENSE`, `LICENSE.*`, `LICENCE`, `LICENCE.*`

The package-local files referenced by these entry-point fields are also always included:

- The file referenced by a string-valued `browser`
- The file referenced by `main`
- The file(s) referenced by `bin`

## Examples

```json
// ❌
{
	"files": [
		"src",
		"package.json"
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

```json
// ❌
{
	"files": [
		"!tests"
	]
}
```

```json
// ✅
{
	"files": [
		"**",
		"!tests"
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
