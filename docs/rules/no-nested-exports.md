# no-nested-exports

📝 Disallow `exports` and `imports` in nested `package.json` files.

💼 This rule is enabled in the ✅ `recommended` [config](https://github.com/sindresorhus/eslint-package-json#configs).

💡 This rule is manually fixable by [editor suggestions](https://eslint.org/docs/latest/use/core-concepts#rule-suggestions).

<!-- end auto-generated rule header -->
<!-- Do not manually modify this header. Run: `npm run fix:eslint-docs` -->

Node.js only uses `exports` and `imports` from the package root's `package.json`. These fields are ignored in nested manifests, so they cannot define package entry points or package imports there. Some bundlers may still read them, which can lead to different resolution behavior between tools.

This rule treats the `package.json` in ESLint's configured working directory as the package root. In a monorepo, lint each package with its own working directory or disable this rule for workspace manifests.

The rule offers a suggestion to remove each ignored field when it is the only occurrence of that field, but does not autofix because removing the field can affect bundler-specific behavior.

## Examples

The examples below assume the file is nested below the package root.

```json
// ❌
{
	"exports": "./index.js"
}
```

```json
// ✅
{
	"name": "foo"
}
```

The same fields are valid in the package root's `package.json`:

```json
// ✅
{
	"exports": "./index.js",
	"imports": {
		"#internal": "./internal.js"
	}
}
```
