# no-fallback-export-arrays

📝 Discourage string-target fallback arrays in `exports`/`imports`.

💼 This rule is enabled in the ✅ `recommended` [config](https://github.com/sindresorhus/eslint-package-json#configs).

<!-- end auto-generated rule header -->
<!-- Do not manually modify this header. Run: `npm run fix:eslint-docs` -->

The `exports` and `imports` fields support arrays, but Node.js does not use them to try another file when the first string target is missing. This can make a package fail at runtime when an array is intended as a file-existence fallback.

This rule reports arrays with multiple direct string targets. Arrays containing condition objects or other values are left alone because they can use Node.js's supported condition fallback behavior.

## Examples

```json
// ❌
{
	"exports": {
		".": [
			"./a.js",
			"./b.js"
		]
	}
}
```

```json
// ✅
{
	"exports": {
		".": [
			{
				"development": "./development.js"
			},
			"./index.js"
		]
	}
}
```

```json
// ❌
{
	"imports": {
		"#dep": [
			"./a.js",
			"./b.js"
		]
	}
}
```

```json
// ✅
{
	"imports": {
		"#dep": [
			{
				"development": "./development.js"
			},
			"./dep.js"
		]
	}
}
```
