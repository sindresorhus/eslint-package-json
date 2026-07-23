# no-redundant-files

📝 Disallow redundant entries in the `files` field.

💼 This rule is enabled in the ✅ `recommended` [config](https://github.com/sindresorhus/eslint-package-json#configs).

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->

npm always includes `package.json`, readme, license, copying, and `bin` files. This rule reports redundant always-included entries, duplicates, and ineffective negations.

`files` patterns are applied in order. A negation is reported when no earlier literal or universal pattern can cover it. Ambiguous glob overlap is ignored, and the rule does not inspect the filesystem.

npm expands `files` entries as package-rooted globs, so a negation only applies at the package root: `["dist", "!tests"]` cannot drop `dist/tests`, whatever the earlier pattern matched.

Always-included names (case-insensitive):

- `package.json`
- `README`, `README.*` (e.g., `README.md`)
- `COPYING`, `COPYING.*`
- `LICENSE`, `LICENSE.*`, `LICENCE`, `LICENCE.*`

## Examples

```json
// ❌ — `!tests` is rooted, so it cannot exclude `dist/tests`.
{
	"files": [
		"dist",
		"!tests"
	]
}
```

```json
// ✅ — a rooted negation needs a rooted path.
{
	"files": [
		"dist",
		"!dist/tests"
	]
}
```

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
