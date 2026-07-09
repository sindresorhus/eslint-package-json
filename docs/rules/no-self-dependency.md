# no-self-dependency

📝 Disallow a package depending on itself.

💼 This rule is enabled in the ✅ `recommended` [config](https://github.com/sindresorhus/eslint-package-json#configs).

💡 This rule is manually fixable by [editor suggestions](https://eslint.org/docs/latest/use/core-concepts#rule-suggestions).

<!-- end auto-generated rule header -->
<!-- Do not manually modify this header. Run: `npm run fix:eslint-docs` -->

A package must not list its own `name` in any dependency group (`dependencies`, `devDependencies`, `peerDependencies`, or `optionalDependencies`). It usually happens through a copy-paste slip or a stray entry in a monorepo, and it is never meaningful.

## Examples

```json
// ❌
{
	"name": "foo",
	"dependencies": {
		"foo": "^1.0.0"
	}
}
```

```json
// ✅
{
	"name": "foo",
	"dependencies": {
		"bar": "^1.0.0"
	}
}
```
