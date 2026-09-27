# no-typo-fields

📝 Disallow misspelled package.json field names.

💼 This rule is enabled in the ✅ `recommended` [config](https://github.com/sindresorhus/eslint-package-json#configs).

💡 This rule is manually fixable by [editor suggestions](https://eslint.org/docs/latest/use/core-concepts#rule-suggestions).

<!-- end auto-generated rule header -->
<!-- Do not manually modify this header. Run: `npm run fix:eslint-docs` -->

A misspelled top-level field name is silently ignored by npm, so a typo like `dependancies` or `scripts` written as `script` does nothing. This rule flags an unknown field that is a known misspelling, or a single-character slip of a standard field, and suggests the rename.

The rename is a suggestion rather than an autofix, since it changes what npm reads, and it is not offered when the corrected field already exists.

Genuinely custom fields (tool configs like `xo`, `ava`, `c8`) are left alone, since they are not close to any standard field. The single-character slip check only covers fields of four or more characters, so a slip of `bin`, `os`, or `man` is only caught from the known-misspelling list. Deprecated fields are handled by [`no-deprecated-fields`](./no-deprecated-fields.md).

## Examples

```json
// ❌
{
	"dependancies": {}
}
```

```json
// ❌
{
	"repostitory": {
		"type": "git",
		"url": "https://github.com/user/repo.git"
	}
}
```

```json
// ✅
{
	"dependencies": {}
}
```
