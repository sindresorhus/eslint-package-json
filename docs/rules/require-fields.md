# require-fields

📝 Require specific fields to be present, always or only for published packages.

💼 This rule is enabled in the ✅ `recommended` [config](https://github.com/sindresorhus/eslint-package-json#configs).

<!-- end auto-generated rule header -->
<!-- Do not manually modify this header. Run: `npm run fix:eslint-docs` -->

Ensures that specific top-level fields are present in `package.json`, either unconditionally or only when the package can be published (not marked `"private": true`).

- `fields` (default `[]`) are required in *every* package.json, public or private.
- `fieldsWhenPublic` (default `['name', 'version', 'description', 'license', 'keywords']`) are only required for a package that can actually be published; a private package is exempt.

This is the complement of [`restrict-fields-when-private`](./restrict-fields-when-private.md), which flags fields that are pointless on a private package.

## Options

### `fields`

Type: `string[]`\
Default: `[]`

The field names that must always be present at the top level.

```js
{
	'package-json/require-fields': [
		'error', {
			fields: [
				'name',
				'version',
				'engines'
			]
		}
	]
}
```

### `fieldsWhenPublic`

Type: `string[]`\
Default: `['name', 'version', 'description', 'license', 'keywords']`

The field names a public (non-private) package must declare.

Providing this option replaces the default list.

```js
{
	'package-json/require-fields': [
		'error',
		{
			fieldsWhenPublic: [
				'name',
				'version',
				'description',
				'license',
				'keywords',
				'repository'
			]
		}
	]
}
```

## Examples

```json
// ❌
{
	"name": "my-package"
}
```

```json
// ✅
{
	"name": "my-package",
	"version": "1.0.0",
	"license": "MIT",
	"keywords": ["cli"],
	"description": "…"
}
```

```json
// ✅
{
	"private": true
}
```
