# no-overrides-in-published-package

📝 Disallow `overrides` in packages that can be published.

💼 This rule is enabled in the ✅ `recommended` [config](https://github.com/sindresorhus/eslint-package-json#configs).

💡 This rule is manually fixable by [editor suggestions](https://eslint.org/docs/latest/use/core-concepts#rule-suggestions).

<!-- end auto-generated rule header -->
<!-- Do not manually modify this header. Run: `npm run fix:eslint-docs` -->

npm only applies [`overrides`](https://docs.npmjs.com/cli/v11/configuring-npm/package-json/#overrides) from a project's root `package.json`. When a package is installed as a dependency, npm ignores its `overrides` field, so published packages cannot use it to control their consumers' dependency tree.

This rule reports `overrides` in packages that can be published. A package with `"private": true` is exempt, because npm refuses to publish it and its root-project overrides can still be useful.

If consumers need a particular dependency resolution, pin the relevant dependencies or use an `npm-shrinkwrap.json` file. Removing `overrides` changes the root project's dependency resolution, so the rule offers an editor suggestion rather than an automatic fix.

## Examples

```json
// ❌
{
	"name": "my-library",
	"overrides": {
		"vulnerable-dependency": "1.2.3"
	}
}
```

```json
// ✅
{
	"name": "my-application",
	"private": true,
	"overrides": {
		"vulnerable-dependency": "1.2.3"
	}
}
```
