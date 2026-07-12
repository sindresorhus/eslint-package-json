# no-package-manager-engines

📝 Disallow package manager versions in the `engines` field.

💼 This rule is enabled in the ✅ `recommended` [config](https://github.com/sindresorhus/eslint-package-json#configs).

💡 This rule is manually fixable by [editor suggestions](https://eslint.org/docs/latest/use/core-concepts#rule-suggestions).

<!-- end auto-generated rule header -->
<!-- Do not manually modify this header. Run: `npm run fix:eslint-docs` -->

Constraining a package manager version through `engines` (for example `engines.npm`, `engines.yarn`, `engines.pnpm`, or `engines.bun`) commonly goes stale and blocks installs for users on a different, perfectly compatible version. The modern mechanism is the [`packageManager`](https://nodejs.org/api/corepack.html) field, which Corepack uses to provision the exact package manager version for the project.

The migration suggestion infers the lowest semver version allowed by the engine range and pins it in `packageManager` (for example, `>=10` becomes `npm@10.0.0`). Ranges without a usable lower bound, malformed or non-string values, multiple package manager engines, or an existing `packageManager` field offer only the removal suggestion.

`engines.node` is unaffected and remains the right place to declare the supported Node.js version.

## Examples

```json
// ❌
{
	"engines": {
		"node": ">=18",
		"npm": ">=10"
	}
}
```

```json
// ✅
{
	"engines": {
		"node": ">=18"
	},
	"packageManager": "npm@10.0.0"
}
```
