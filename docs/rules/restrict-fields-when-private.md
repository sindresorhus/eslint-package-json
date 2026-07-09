# restrict-fields-when-private

📝 Disallow fields that have no effect when the package is private.

💡 This rule is manually fixable by [editor suggestions](https://eslint.org/docs/latest/use/core-concepts#rule-suggestions).

<!-- end auto-generated rule header -->

When a package has `"private": true`, publishing-related fields like `publishConfig` and `files` have no effect. This rule flags them as unnecessary so they can be removed.

The rule only reports when `private` is the boolean `true`. It does not trigger for `"private": false` or when `private` is absent.

This is the complement of [`require-fields`](./require-fields.md)'s `fieldsWhenPublic` option, which flags fields missing on a package that *can* be published.

## Options

### `fields`

Type: `string[]`\
Default: `['publishConfig', 'files']`

The fields to disallow when the package is private.

```js
{
	'package-json/restrict-fields-when-private': ['error', {fields: ['publishConfig', 'files', 'funding']}]
}
```

## Examples

```json
// ❌
{
	"name": "my-package",
	"private": true,
	"publishConfig": {"access": "public"},
	"files": ["dist"]
}
```

```json
// ✅
{
	"name": "my-package",
	"private": true
}
```
