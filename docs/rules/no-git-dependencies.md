# no-git-dependencies

📝 Disallow git URLs as dependency specifiers.

<!-- end auto-generated rule header -->

Git URL specifiers (like `git+https://github.com/user/repo`, `github:user/repo`, `user/repo`) are fragile: they bypass the npm registry, won't resolve properly in all environments, and often lack a specific version. Use a published registry version instead.

Detected patterns: `git+` prefix, `git://` protocol, `github:` / `gitlab:` / `bitbucket:` shorthands, URLs ending in `.git`, and bare `owner/repo` shorthands.

## Options

### `allowWithRef`

Type: `boolean`\
Default: `false`

When `true`, allows git specifiers that pin a specific ref (i.e. the specifier contains `#`). Useful when a package is not published to npm but you want to pin to a specific commit or tag.

```js
{
	'package-json/no-git-dependencies': [
		'error',
		{
			allowWithRef: true
		}
	]
}
```

## Examples

```json
// ❌
{
	"dependencies": {
		"foo": "github:user/repo"
	}
}
```

```json
// ❌
{
	"dependencies": {
		"foo": "user/repo"
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

With `{allowWithRef: true}`:

```json
// ✅
{
	"dependencies": {
		"foo": "github:user/repo#v1.0.0"
	}
}
```
