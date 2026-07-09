# no-core-module-dependencies

📝 Disallow dependencies that shadow Node.js built-in modules.

💼 This rule is enabled in the ✅ `recommended` [config](https://github.com/sindresorhus/eslint-package-json#configs).

💡 This rule is manually fixable by [editor suggestions](https://eslint.org/docs/latest/use/core-concepts#rule-suggestions).

<!-- end auto-generated rule header -->
<!-- Do not manually modify this header. Run: `npm run fix:eslint-docs` -->

A dependency whose name matches a Node.js built-in module (`path`, `fs`, `os`, `crypto`, `util`, `stream`, `querystring`, `punycode`, …) is almost always a mistake: you meant the built-in, or you've pulled in a stale, abandoned polyfill. Such names are also a typosquatting and dependency-confusion surface. Note that `require('path')` resolves to the built-in regardless, so the installed package is usually dead weight.

This rule flags dependencies whose names are Node.js built-in modules, and offers a suggestion to remove them. Some built-in names (`buffer`, `events`, `process`) are also legitimate browser polyfills, so use the `ignore` option to allow the ones you intend.

## Options

### `ignore`

Type: `string[]`\
Default: `[]`

Built-in module names to allow as dependencies.

## Examples

```json
// ❌
{
	"dependencies": {
		"path": "^0.12.7"
	}
}
```

```json
// ✅
{
	"dependencies": {
		"globby": "^14.0.0"
	}
}
```
