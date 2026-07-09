# consistent-path-prefix

📝 Enforce consistent `./` prefix on local path fields.

💼 This rule is enabled in the ✅ `recommended` [config](https://github.com/sindresorhus/eslint-package-json#configs).

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->

Enforce consistent `./` prefix on local file-path fields.

Checks the `main`, `module`, `browser`, `types`, `typings`, and `bin` fields. Absolute paths, URLs, globs, and `../`-relative paths are ignored.

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
