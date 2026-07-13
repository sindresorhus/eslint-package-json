# consistent-path-prefix

📝 Enforce consistent `./` prefix on local path fields.

💼 This rule is enabled in the ✅ `recommended` [config](https://github.com/sindresorhus/eslint-package-json#configs).

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->

Enforce a consistent `./` prefix in the legacy `main`, `module`, `browser`, `types`, `typings`, and `bin` fields. Absolute paths, URLs, and globs are ignored; other paths with a `..` segment are reported. Mandatory prefixes in `exports` and `imports` are handled by [`valid-fields`](valid-fields.md).

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
