# no-missing-files

📝 Disallow missing files referenced by package metadata.

<!-- end auto-generated rule header -->

This rule checks that local targets in `exports` and positive patterns in `files` match something in the package directory.

Path matching is case-sensitive, even on case-insensitive filesystems.

The rule checks the filesystem when ESLint runs. Generated output such as `dist` or `distribution` is supported when it already exists, so run ESLint after the build when the package metadata references generated files.

For `exports`, conditional branches are checked independently. Export arrays are treated as fallbacks and are valid when at least one candidate exists. Wildcard targets only need to match at least one file because the complete set of possible subpaths cannot be determined statically. Directory targets are not considered valid export targets.

For `files`, positive paths and glob patterns must match a file or directory. Negated patterns are exclusions and are ignored by this rule. The check only verifies matches in the source tree. It does not reproduce npm's complete packlist behavior, so use `npm pack --dry-run` to verify the final package contents.

This rule focuses on existence, not path syntax. Malformed values are ignored rather than reported as missing. It intentionally does not check legacy fields such as `main`, `module`, `browser`, `types`, `typings`, `es2015`, `jsnext:main`, `bin`, `man`, or `directories`. It also does not check `imports` or custom metadata fields.

## Examples

```json
// ❌
{
	"exports": "./missing.js"
}
```

```json
// ✅
{
	"exports": "./index.js"
}
```

```json
// ❌
{
	"exports": {
		"./feature/*": "./missing/*.js"
	}
}
```

```json
// ✅
{
	"exports": {
		"./rules/*": "./rules/*.js"
	}
}
```

```json
// ❌
{
	"exports": [
		"./missing.js",
		"./also-missing.js"
	]
}
```

```json
// ✅
{
	"exports": [
		"./missing.js",
		"./index.js"
	]
}
```

```json
// ❌
{
	"files": [
		"missing"
	]
}
```

```json
// ✅
{
	"files": [
		"rules/*.js"
	]
}
```

```json
// ✅
{
	"files": [
		"dist",
		"!dist/**/*.test.js"
	]
}
```

```json
// ✅
{
	"main": "./missing.js",
	"types": "./missing.d.ts",
	"bin": "./missing-cli.js"
}
```
