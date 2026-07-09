# no-install-scripts

📝 Disallow `install` lifecycle scripts.

💼 This rule is enabled in the ✅ `recommended` [config](https://github.com/sindresorhus/eslint-package-json#configs).

💡 This rule is manually fixable by [editor suggestions](https://eslint.org/docs/latest/use/core-concepts#rule-suggestions).

<!-- end auto-generated rule header -->
<!-- Do not manually modify this header. Run: `npm run fix:eslint-docs` -->

The `preinstall`, `install`, and `postinstall` lifecycle scripts run automatically when a package is installed. They are a recurring supply-chain attack vector (e.g. the Shai-Hulud and event-stream attacks executed code on install), so much so that npm v12 blocks them by default and pnpm, Yarn, and Bun already do.

This rule flags those scripts. If your package genuinely needs one (for example a native addon build), disable the rule for that file or line.

## Examples

```json
// ❌
{
	"scripts": {
		"postinstall": "node ./scripts/setup.js"
	}
}
```

```json
// ✅
{
	"scripts": {
		"build": "tsc"
	}
}
```
