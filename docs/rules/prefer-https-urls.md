# prefer-https-urls

📝 Prefer `https://` URLs in metadata fields.

💼 This rule is enabled in the ✅ `recommended` [config](https://github.com/sindresorhus/eslint-package-json#configs).

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->
<!-- Do not manually modify this header. Run: `npm run fix:eslint-docs` -->

Metadata URLs should use `https://`. An `http://` URL is insecure and increasingly unsupported; npm's own documentation uses `https://` throughout.

This rule flags `http://` URLs in `homepage`, `bugs`, `repository`, and `funding` (string, `url`, or array forms) and autofixes them to `https://`.

## Examples

```json
// ❌
{
	"homepage": "http://example.com"
}
```

```json
// ✅
{
	"homepage": "https://example.com"
}
```
