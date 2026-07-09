# no-restricted-fields

📝 Disallow specific fields.

💡 This rule is manually fixable by [editor suggestions](https://eslint.org/docs/latest/use/core-concepts#rule-suggestions).

<!-- end auto-generated rule header -->

Ban specific top-level fields from `package.json`. Useful for enforcing team conventions, such as disallowing `funding` or `browser` in internal packages.

Each entry can be a plain string (uses a default message) or an object with a `field` and optional custom `message`.

## Options

### `fields`

Type: `(string | {field: string, message?: string})[]`\
Default: `[]`

The fields to disallow. Each item is either a field name string or an object with a `field` name and an optional `message` explaining why the field is not allowed.

```js
{
	'package-json/no-restricted-fields': ['error', {
		fields: [
			'funding',
			{field: 'browser', message: 'Use the exports field instead.'}
		]
	}]
}
```

## Examples

With `{fields: ['funding']}`:

```json
// ❌
{
	"name": "my-package",
	"funding": "https://example.com"
}
```

```json
// ✅
{
	"name": "my-package"
}
```
