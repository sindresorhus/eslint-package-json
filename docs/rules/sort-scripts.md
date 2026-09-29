# sort-scripts

📝 Enforce alphabetical ordering of scripts.

💡 This rule is manually fixable by [editor suggestions](https://eslint.org/docs/latest/use/core-concepts#rule-suggestions).

<!-- end auto-generated rule header -->

Alphabetically sorted scripts are easier to scan and produce cleaner diffs when adding or removing commands. [ESLint's package.json conventions](https://eslint.org/docs/latest/contribute/package-json-conventions) require script names to appear in alphabetical order.

The sorting is a suggestion rather than an autofix, since [npm-run-all](https://github.com/mysticatea/npm-run-all)'s `run-s "build:*"` runs matching scripts in the order they are written.

## Examples

```json
// ❌
{
	"scripts": {
		"test": "node --test",
		"build": "tsc"
	}
}
```

```json
// ✅
{
	"scripts": {
		"build": "tsc",
		"test": "node --test"
	}
}
```
