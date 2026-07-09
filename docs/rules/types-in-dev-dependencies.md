# types-in-dev-dependencies

📝 Enforce `@types/*` packages to be in `devDependencies`.

💡 This rule is manually fixable by [editor suggestions](https://eslint.org/docs/latest/use/core-concepts#rule-suggestions).

<!-- end auto-generated rule header -->

`@types/*` packages are usually only needed during development and type-checking, with no runtime value, so they belong in `devDependencies` rather than `dependencies`/`optionalDependencies` (which would make consumers install them unnecessarily).

The exception is a `@types/*` package whose types leak into your own public API (for example, a function that returns a type imported from it). Consumers type-checking against your package then need that `@types/*` package resolvable too, which `devDependencies` cannot guarantee since it isn't installed for them — it needs to be a real `dependency` (or, like a regular runtime dependency exposed this way, a `peerDependency`, which this rule already leaves unchecked). This can't be detected from `package.json` alone, so use the `ignore` option to exempt such a package by name.

This rule offers a suggestion to move the entry into `devDependencies`, unless it already exists there at a different range.

## Options

### `ignore`

Type: `string[]`\
Default: `[]`

`@types/*` package names to exempt, for packages whose types leak into your public API and so must stay a real dependency.

```js
{
	'package-json/types-in-dev-dependencies': [
		'error',
		{
			ignore: [
				'@types/node'
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
		"@types/node": "^20.0.0"
	}
}
```

```json
// ✅
{
	"devDependencies": {
		"@types/node": "^20.0.0"
	}
}
```
