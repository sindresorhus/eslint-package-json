# no-git-dependencies

📝 Disallow git URLs as dependency specifiers.

<!-- end auto-generated rule header -->

Git URL specifiers (like `git+https://github.com/user/repo`, `github:user/repo`, `user/repo`) are fragile: they bypass the npm registry, won't resolve properly in all environments, and often lack a specific version. Use a published registry version instead.

Detection uses npm's own `npm-package-arg`, which tells a git remote from a tarball by host and protocol, not by a `.git` suffix. So `https://github.com/user/repo` is a git remote, while `https://example.com/foo.git` is a tarball, left to [`no-http-dependencies`](no-http-dependencies.md). Local paths such as `file:../foo.git` are left to [`no-local-dependencies`](no-local-dependencies.md).

## Options

### `allowWithRef`

Type: `boolean`\
Default: `false`

When `true`, allows a git specifier that contains a `#`. Useful when a package is not published to npm but you want to pin to a specific commit or tag. What follows the `#` is not checked, so a semver range or a bare `#` passes too, although neither pins.

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
