# no-restricted-dependencies

📝 Disallow specific dependencies.

<!-- end auto-generated rule header -->

Ban specific packages across all dependency groups. Useful for enforcing policies like "don't use deprecated packages" or "use our internal fork instead".

## Options

### `packages`

Type: `(string | {name: string, message?: string})[]`\
Default: `[]`

The list of banned packages. Each entry is either a package name string, or an object with a `name` and an optional custom `message`.

```js
{
	'package-json/no-restricted-dependencies': ['error', {
		packages: [
			'lodash',
			{name: 'moment', message: 'Use date-fns instead.'},
		]
	}]
}
```

## Examples

```json
// ❌ (with packages: ['lodash'])
{
	"dependencies": {
		"lodash": "^4.0.0"
	}
}
```

```json
// ✅ (with packages: ['lodash'])
{
	"dependencies": {
		"lodash-es": "^4.0.0"
	}
}
```
