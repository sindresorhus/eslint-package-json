# sort-scripts

📝 Enforce alphabetical ordering of scripts.

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->

Alphabetically sorted scripts are easier to scan and produce cleaner diffs when adding or removing commands. [ESLint's package.json conventions](https://eslint.org/docs/latest/contribute/package-json-conventions) require script names to appear in alphabetical order.

The fixer preserves script names and commands while rebuilding their object with the file's indentation and newline style. npm identifies scripts by name, so reordering them does not change when they run.

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
