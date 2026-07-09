# dependency-version-range

📝 Enforce a consistent version range style for dependencies.

💼 This rule is enabled in the ✅ `recommended` [config](https://github.com/sindresorhus/eslint-package-json#configs).

💡 This rule is manually fixable by [editor suggestions](https://eslint.org/docs/latest/use/core-concepts#rule-suggestions).

<!-- end auto-generated rule header -->

Teams often want a single, consistent version range style across their dependencies. This rule enforces one of caret (`^`), tilde (`~`), or exact ranges.

Only plain single-version specifiers (like `1.2.3`, `^1.2.3`, `~1.2.3`) are checked. Complex ranges, tags (`latest`), `workspace:` protocols, git URLs, and other non-registry specifiers are ignored.

Changing a version range alters which versions npm will install, so this rule offers a suggestion rather than an autofix.

## Options

### `range`

Type: `'caret' | 'tilde' | 'exact' | 'consistent'`\
Default: `'caret'`

The required version range style. `'consistent'` does not mandate a specific style; instead it picks the style already used by most dependencies and flags the outliers, so a file using a single style throughout always passes. Ties are broken in favor of caret (`^`).

### `dependencyTypes`

Type: `string[]`\
Default: `['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies']`

Which dependency groups to check.

### `exceptions`

Type: `string[]`\
Default: `[]`

Package names to skip.

```js
{
	'package-json/dependency-version-range': ['error', {
		range: 'caret',
		dependencyTypes: ['dependencies'],
		exceptions: ['some-pinned-package']
	}]
}
```

## Examples

With `{range: 'caret'}` (the default):

```json
// ❌
{
	"dependencies": {
		"foo": "1.2.3"
	}
}
```

```json
// ✅
{
	"dependencies": {
		"foo": "^1.2.3"
	}
}
```
