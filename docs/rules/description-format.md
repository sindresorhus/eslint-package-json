# description-format

📝 Enforce formatting of the `description` field.

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->

Enforce consistent formatting of the `description` field in package.json.

By default, this rule requires the description to start with an uppercase letter and does not require it to end with a period.

## Options

### `startWithUppercase`

Type: `boolean`\
Default: `true`

Require the description to start with an uppercase letter.

### `endWithPeriod`

Type: `boolean`\
Default: `false`

When `true`, requires the description to end with a period. When `false` (default), disallows a trailing period.

```js
{
	'package-json/description-format': [
		'error',
		{
			startWithUppercase: true,
			endWithPeriod: false
		}
	]
}
```

## Examples

With defaults (`startWithUppercase: true`, `endWithPeriod: false`):

```json
// ❌
{
	"description": "my package does things"
}
```

```json
// ✅
{
	"description": "My package does things"
}
```

With `{endWithPeriod: true}`:

```json
// ❌
{
	"description": "My package does things"
}
```

```json
// ✅
{
	"description": "My package does things."
}
```
