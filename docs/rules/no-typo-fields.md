# no-typo-fields

📝 Disallow misspelled package.json field names.

💼 This rule is enabled in the ✅ `recommended` [config](https://github.com/sindresorhus/eslint-package-json#configs).

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->
<!-- Do not manually modify this header. Run: `npm run fix:eslint-docs` -->

A misspelled top-level field name is silently ignored by npm, so a typo like `dependancies` or `scripts` written as `script` does nothing. This rule flags an unknown field that is a known misspelling, or a single-character slip of a standard field, and renames it to the correct name.

Genuinely custom fields (tool configs like `xo`, `ava`, `c8`) are left alone, since they are not close to any standard field. Deprecated fields are handled by [`no-deprecated-fields`](./no-deprecated-fields.md).

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
	"repositories": "user/repo"
}
```

```json
// ✅
{
	"dependencies": {}
}
```
