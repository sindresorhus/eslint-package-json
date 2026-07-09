# no-pre-release-dependencies

📝 Disallow pre-release versions as dependency specifiers.

<!-- end auto-generated rule header -->

Pre-release versions (like `1.0.0-alpha.1`, `^2.0.0-beta.3`) are unstable and may contain breaking changes between releases. Production dependencies should use stable versions.

A specifier is considered pre-release if its minimum resolvable version (via `semver.minVersion`) is a pre-release version.

## Options

### `ignore`

Type: `string[]`\
Default: `[]`

Package names to skip.

```js
{
	'package-json/no-pre-release-dependencies': ['error', {
		ignore: ['some-alpha-package']
	}]
}
```

## Examples

```json
// ❌
{
	"dependencies": {
		"foo": "^1.0.0-beta.1"
	}
}
```

```json
// ❌
{
	"dependencies": {
		"foo": "1.0.0-alpha.1"
	}
}
```

```json
// ✅
{
	"dependencies": {
		"foo": "^1.0.0"
	}
}
```
