# no-local-dependencies

📝 Disallow local filesystem paths as dependency specifiers.

<!-- end auto-generated rule header -->

Local filesystem path specifiers (like `file:../foo`, `./foo`, `../foo`, `/path/to/foo`, `~/foo`, `link:../foo`) should not be published to npm. They only work on the author's machine and will break for consumers.

Only `dependencies`, `optionalDependencies`, and `peerDependencies` are checked, since those are what npm installs downstream. A local path in `devDependencies` reaches nobody — it is how packages point at test fixtures and self-link to dogfood their own entry points — so it is left alone.

## Options

### `ignore`

Type: `string[]`\
Default: `[]`

Package names to skip.

```js
{
	'package-json/no-local-dependencies': [
		'error',
		{
			ignore: [
				'my-local-only-package'
			]
		}
	]
}
```

## Examples

```json
// ❌
{
	"dependencies": {
		"foo": "file:../foo"
	}
}
```

```json
// ❌
{
	"dependencies": {
		"foo": "./packages/foo"
	}
}
```

```json
// ✅
{
	"dependencies": {
		"foo": "^1.0.0"
	}
}
```

```json
// ✅ — a consumer never installs `devDependencies`.
{
	"devDependencies": {
		"fixture": "file:./test/fixtures/fixture"
	}
}
```
