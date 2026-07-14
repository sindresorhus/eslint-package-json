# no-redundant-files

📝 Disallow redundant entries in the `files` field.

💼 This rule is enabled in the ✅ `recommended` [config](https://github.com/sindresorhus/eslint-package-json#configs).

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->

npm always includes certain files regardless of the [`files`](https://docs.npmjs.com/cli/configuring-npm/package-json#files) field: `package.json`, `README` (all variants), `COPYING` (all variants), `LICENSE`/`LICENCE` (all variants), and the files referenced by `browser`, `main`, and `bin`. Listing them explicitly is redundant and adds noise.

This rule also catches exact duplicate entries in the `files` array when no intervening opposite pattern can make the repeated entry useful.

npm applies `files` patterns in order, so a negated pattern is only useful when an earlier pattern includes something it can exclude. This rule catches negations with no earlier matching literal or universal (`*`, `**`, `.` or `./`) pattern. Literal negations that target npm's always-included files are also reported. npm treats an odd number of leading `!` characters as a negation prefix and an even number as an inclusion prefix. An empty negation is ignored, while an empty inclusion covers the package like a root pattern. Literal overlap follows npm's case-insensitive matching. Overlap involving richer glob syntax is ambiguous and is left alone. The rule does not inspect the filesystem.

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

```json
// ✅
{
	"files": [
		".",
		"!tests"
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
// ❌
{
	"files": [
		"dist",
		"!tests"
	]
}
```

```json
// ✅
{
	"files": [
		"dist",
		"!dist/tests"
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
