# require-private

📝 Require the `private` field to be `true`.

💡 This rule is manually fixable by [editor suggestions](https://eslint.org/docs/latest/use/core-concepts#rule-suggestions).

<!-- end auto-generated rule header -->
<!-- Do not manually modify this header. Run: `npm run fix:eslint-docs` -->

If you set `"private": true` in `package.json`, npm refuses to publish the package. This rule is useful for projects that should never be published, such as apps and internal packages.

This rule is opt-in because most packages are intended to be published. Enable it explicitly in your ESLint configuration:

```js
{
	'package-json/require-private': 'error',
}
```

## Examples

```json
// ❌
{
	"name": "my-application"
}
```

```json
// ✅
{
	"name": "my-application",
	"private": true
}
```
