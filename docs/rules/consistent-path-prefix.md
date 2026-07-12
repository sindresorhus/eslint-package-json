# consistent-path-prefix

📝 Enforce consistent `./` prefix on local path fields.

💼 This rule is enabled in the ✅ `recommended` [config](https://github.com/sindresorhus/eslint-package-json#configs).

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->

Enforce a consistent `./` prefix on legacy local file-path fields. This rule is stylistic: the package-map validators enforce the mandatory `./` prefix for `exports` targets and local `imports` targets.

Checks the `main`, `module`, `browser`, `types`, `typings`, and `bin` fields. Absolute paths, URLs, and globs are ignored. Any path containing a `..` segment is reported because it would escape the package, regardless of the selected prefix style.

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
