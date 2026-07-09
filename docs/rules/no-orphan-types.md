# no-orphan-types

📝 Disallow `@types/*` packages without a corresponding dependency.

💼 This rule is enabled in the ✅ `recommended` [config](https://github.com/sindresorhus/eslint-package-json#configs).

💡 This rule is manually fixable by [editor suggestions](https://eslint.org/docs/latest/use/core-concepts#rule-suggestions).

<!-- end auto-generated rule header -->
<!-- Do not manually modify this header. Run: `npm run fix:eslint-docs` -->

A `@types/foo` package provides type definitions for a `foo` package. If `foo` is not a dependency anywhere, the `@types/foo` entry is dead weight, usually left behind after the runtime dependency was removed.

This rule flags a `@types/*` package in `dependencies`/`devDependencies` that has no corresponding dependency. Scoped types follow the `@types/foo__bar` → `@foo/bar` convention. Ambient type packages with no runtime counterpart (`@types/node`, `@types/bun`) are ignored by default; add more with the `ignore` option.

## Options

### `ignore`

Type: `string[]`\
Default: `[]`

Additional `@types/*` package names to allow without a corresponding dependency. The built-in defaults (`@types/node`, `@types/bun`) are always ignored.

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
