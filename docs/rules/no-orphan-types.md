# no-orphan-types

📝 Disallow `@types/*` packages without a corresponding dependency.

💼 This rule is enabled in the ✅ `recommended` [config](https://github.com/sindresorhus/eslint-package-json#configs).

💡 This rule is manually fixable by [editor suggestions](https://eslint.org/docs/latest/use/core-concepts#rule-suggestions).

<!-- end auto-generated rule header -->
<!-- Do not manually modify this header. Run: `npm run fix:eslint-docs` -->

A `@types/foo` package provides type definitions for a `foo` package. If `foo` is not a dependency anywhere, the `@types/foo` entry is dead weight, usually left behind after the runtime dependency was removed.

This rule flags a `@types/*` package in `dependencies`/`devDependencies` that has no corresponding dependency. Scoped types follow the `@types/foo__bar` → `@foo/bar` convention. Ignored by default: ambient type packages with no runtime counterpart (`@types/node`, `@types/chrome`), AST types usually provided through another package (`@types/mdast`, `@types/estree`), and the `@types/*` dependencies of a `@types/*` package. See the [source file](../../rules/no-orphan-types.js) for the full list. The rule cannot see the dependency tree, so add types for transitive dependencies to the `ignore` option.

## Options

### `ignore`

Type: `string[]`\
Default: `[]`

Additional `@types/*` package names or corresponding runtime package names to allow without a corresponding dependency. For example, both `@types/foo` and `foo` ignore the `@types/foo` package. For scoped packages, both `@types/foo__bar` and `@foo/bar` are accepted. The built-in defaults (`@types/node`, `@types/bun`, `@types/chrome`) are always ignored; see the [source file](../../rules/no-orphan-types.js) for the full list.

```js
'package-json/no-orphan-types': [
	'error',
	{
		ignore: [
			'chrome',
			'react',
		],
	},
]
```

## Examples

```json
// ❌
{
	"devDependencies": {
		"@types/foo": "^1.0.0"
	}
}
```

```json
// ✅
{
	"dependencies": {
		"foo": "^1.0.0"
	},
	"devDependencies": {
		"@types/foo": "^1.0.0"
	}
}
```
