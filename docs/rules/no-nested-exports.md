# no-nested-exports

📝 Disallow `exports` in nested `package.json` files.

💼 This rule is enabled in the ✅ `recommended` [config](https://github.com/sindresorhus/eslint-package-json#configs).

💡 This rule is manually fixable by [editor suggestions](https://eslint.org/docs/latest/use/core-concepts#rule-suggestions).

<!-- end auto-generated rule header -->
<!-- Do not manually modify this header. Run: `npm run fix:eslint-docs` -->

Node.js does not use `exports` from a nested manifest to define entry points for the package rooted at the configured working directory. The field is therefore ineffective when a nested manifest is intended to configure the parent package, while some bundlers may still read it, which can lead to different resolution behavior between tools.

A nested `exports` is only read when code inside the nested directory imports itself by the nested `name`, so it is nearly always a mistake. `imports` is not checked, since Node resolves `#` specifiers against the nearest `package.json`, which a nested one is for the files inside it.

This rule treats the `package.json` in ESLint's configured working directory as the package root. It does not detect independent package boundaries below that directory. In a monorepo or any repository containing independent nested packages, lint each package with its own working directory or disable this rule for those manifests.

The rule offers a suggestion to remove the ignored field, but does not autofix because removing the field can affect bundler-specific behavior.

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

`imports` stays valid in a nested manifest, and both fields are valid in the package root's `package.json`:

```json
// ✅
{
	"imports": {
		"#internal": "./internal.js"
	}
}
```

```json
// ✅
{
	"exports": "./index.js",
	"imports": {
		"#internal": "./internal.js"
	}
}
```
