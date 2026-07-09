# no-empty-fields

📝 Disallow empty fields.

💼 This rule is enabled in the ✅ `recommended` [config](https://github.com/sindresorhus/eslint-package-json#configs).

💡 This rule is manually fixable by [editor suggestions](https://eslint.org/docs/latest/use/core-concepts#rule-suggestions).

<!-- end auto-generated rule header -->

Empty objects (`{}`), arrays (`[]`), and strings (`""`) in `package.json` are almost always leftovers from refactoring or scaffolding. They add noise and can be misleading.

Use the `ignore` option to allow specific fields where an empty value is meaningful (for example, `"files": []`).

## Options

### `ignore`

Type: `string[]`\
Default: `[]`

Field names to skip.

```js
{
	'package-json/no-empty-fields': ['error', {ignore: ['files']}]
}
```

## Examples

```json
// ❌
{
	"keywords": []
}
```

```json
// ❌
{
	"scripts": {}
}
```

```json
// ✅
{
	"keywords": ["cli", "tool"]
}
```
