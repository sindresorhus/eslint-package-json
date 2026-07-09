# no-deprecated-fields

📝 Disallow fields and scripts that npm has deprecated.

💼 This rule is enabled in the ✅ `recommended` [config](https://github.com/sindresorhus/eslint-package-json#configs).

<!-- end auto-generated rule header -->
<!-- Do not manually modify this header. Run: `npm run fix:eslint-docs` -->

Some `package.json` fields and scripts have been deprecated by npm and no longer do anything (or have a better replacement). Keeping them around is misleading and can silently fail to have the effect you expect.

Detected:

- `jsnext:main`: a pre-`exports` convention. Use the `module` field instead.
- `preferGlobal`: ignored by npm.
- `engineStrict`: ignored by npm.
- `licenses`: the old array form. Use the `license` field with an SPDX expression instead.
- `modules`: a non-standard bundler convention. Use the `exports` field instead.
- The `prepublish` script: it ran on both `npm publish` and a plain `npm install`, which surprised everyone. Use `prepublishOnly` to run only on publish, or `prepare` to also run on local install.

The deprecated `license` object form is handled by [`valid-fields`](./valid-fields.md).

## Examples

```json
// ❌
{
	"jsnext:main": "index.js"
}
```

```json
// ❌
{
	"licenses": [
		{
			"type": "MIT"
		}
	]
}
```

```json
// ❌
{
	"scripts": {
		"prepublish": "npm run build"
	}
}
```

```json
// ✅
{
	"module": "index.js"
}
```

```json
// ✅
{
	"scripts": {
		"prepublishOnly": "npm run build"
	}
}
```
