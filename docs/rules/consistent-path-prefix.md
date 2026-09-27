# consistent-path-prefix

📝 Enforce consistent `./` prefix on local path fields.

💼 This rule is enabled in the ✅ `recommended` [config](https://github.com/sindresorhus/eslint-package-json#configs).

🔧💡 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix) and manually fixable by [editor suggestions](https://eslint.org/docs/latest/use/core-concepts#rule-suggestions).

<!-- end auto-generated rule header -->

Enforce a consistent `./` prefix in the legacy `main`, `module`, `browser`, `types`, `typings`, and `bin` fields. The object form of `browser` is not checked, since its bare values are module requests. Absolute paths, URLs, and globs are ignored; other paths with a `..` segment are reported. An empty value is left to [`no-empty-fields`](no-empty-fields.md). Mandatory prefixes in `exports` and `imports` are handled by [`valid-fields`](valid-fields.md).

For `main` and `browser`, the fix is a suggestion, since npm force-includes them as written, so the prefix can change what a `files` allowlist publishes.

## Options

### `prefix`

Type: `'always' | 'never'`\
Default: `'always'`

- `'always'` — require all local relative paths to start with `./`.
- `'never'` — disallow the `./` prefix.

```js
{
	'package-json/consistent-path-prefix': ['error', {
		prefix: 'always'
	}]
}
```

## Examples

With `{prefix: 'always'}` (the default):

```json
// ❌
{
	"main": "index.js"
}
```

```json
// ✅
{
	"main": "./index.js"
}
```

With `{prefix: 'never'}`:

```json
// ❌
{
	"main": "./index.js"
}
```

```json
// ✅
{
	"main": "index.js"
}
```
