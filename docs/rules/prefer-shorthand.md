# prefer-shorthand

📝 Prefer the shorthand string form of fields where possible.

💼 This rule is enabled in the ✅ `recommended` [config](https://github.com/sindresorhus/eslint-package-json#configs).

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->
<!-- Do not manually modify this header. Run: `npm run fix:eslint-docs` -->

Several fields accept both an object form and a more concise string form. When the object carries no extra information, prefer the shorthand string:

- `bugs`: an object with only a `url` key becomes the URL string.
- `funding`: an object with only a `url` key becomes the URL string.
- `author` and `contributors`: an object with a `name` and no keys beyond `name`, `email`, and `url` becomes the `"Name <email> (url)"` string.
- `repository`: an object pointing at a github.com URL becomes the `github:user/repo` shorthand. Objects with a non-github URL, a `directory` (monorepo subpath), a non-`git` `type`, or any other extra key are left as-is, since they have no unambiguous shorthand.

Each conversion only applies when the shorthand carries the exact same information as the object form — anything that would be lost is left as-is — so this rule is autofixable.

> [!NOTE]
> npm warns about shorthand `repository` values at publish time, but has shared no concrete plans or justification for removing support. Since shorthand remains supported and lossless here, this rule continues to prefer it. See [npm/cli#9778](https://github.com/npm/cli/issues/9778).

## Examples

```json
// ❌
{
	"bugs": {
		"url": "https://github.com/user/repo/issues"
	}
}
```

```json
// ❌
{
	"author": {
		"name": "Sindre Sorhus"
	}
}
```

```json
// ❌
{
	"repository": {
		"type": "git",
		"url": "git+https://github.com/user/repo.git"
	}
}
```

```json
// ✅
{
	"author": "Sindre Sorhus"
}
```

```json
// ✅
{
	"repository": "github:user/repo"
}
```

```json
// ✅
{
	"bugs": {
		"url": "https://example.com",
		"email": "bugs@example.com"
	}
}
```
