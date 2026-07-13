# no-missing-files

📝 Disallow missing files referenced by package metadata.

<!-- end auto-generated rule header -->

This rule checks that local `exports` and `bin` targets and positive `files` patterns exist under the package root. Matching is case-sensitive, even on case-insensitive filesystems.

Run ESLint after building when package metadata references generated files.

For `exports`, conditional branches are checked independently and arrays are treated as fallbacks. A `*` target may match nested path segments and needs to match only one file. Other glob characters are literal, and directories are invalid targets.

For `files`, entries may match files or directories. Negated patterns are ignored. This is not a complete npm packlist check; use `npm pack --dry-run` to verify package contents.

Malformed values are ignored. The rule does not check `imports`, custom metadata, or legacy fields such as `main`, `module`, `browser`, `types`, `typings`, `es2015`, `jsnext:main`, `man`, and `directories`.

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
// ✅ (after the build has created `dist/index.js`)
{
	"exports": "./dist/index.js",
	"files": ["dist"]
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
// ❌
{
	"name": "package-json",
	"bin": "./missing-cli.js"
}
```

```json
// ✅
{
	"name": "package-json",
	"bin": "./index.js"
}
```

```json
// ✅
{
	"main": "./missing.js",
	"types": "./missing.d.ts"
}
```
