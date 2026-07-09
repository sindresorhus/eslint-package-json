# consistent-name-casing

📝 Enforce kebab-case for keys in `scripts` and `bin` objects.

<!-- end auto-generated rule header -->

Kebab-case script and binary names are consistent with npm conventions and work reliably across all operating systems and shells.

For `scripts`, `prepublishOnly` is allowed despite its camelCase since it is npm's only non-kebab lifecycle name. Every other npm lifecycle name (`test`, `prepare`, `postinstall`, etc.) is already lowercase, so it passes the kebab check without a special case. For `bin`, all keys must be kebab-case.

A name is considered kebab-case if every `:`-separated segment is lowercase letters and digits, with single hyphens between words (no leading, trailing, or doubled hyphens).

## Examples

```json
// ❌
{
	"scripts": {
		"buildProd": "tsc --build"
	}
}
```

```json
// ✅
{
	"scripts": {
		"build-prod": "tsc --build"
	}
}
```

```json
// ✅ — `prepublishOnly` is npm's only non-kebab lifecycle name
{
	"scripts": {
		"prepublishOnly": "npm test"
	}
}
```
