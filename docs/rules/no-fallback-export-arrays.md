# no-fallback-export-arrays

📝 Discourage string-target fallback arrays in `exports`/`imports`.

💼 This rule is enabled in the ✅ `recommended` [config](https://github.com/sindresorhus/eslint-package-json#configs).

<!-- end auto-generated rule header -->
<!-- Do not manually modify this header. Run: `npm run fix:eslint-docs` -->

The `exports` and `imports` fields support arrays, but Node.js does not use them as general fallback lists. It does not try another target just because the first file or package is missing, so an array intended as a file-existence fallback can make a package fail at runtime.

This rule reports arrays with at least two direct string targets. Mixed arrays containing condition objects, `null`, or other values are outside this rule's scope, so valid condition-based arrays remain untouched. Invalid package-target strings are ignored when counting targets because Node.js can use them for forward-compatible fallbacks.

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
// ✅
{
	"exports": [
		"not:valid",
		"./submodule.js"
	]
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
