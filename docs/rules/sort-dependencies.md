# sort-dependencies

📝 Enforce alphabetical ordering of dependencies.

💼 This rule is enabled in the ✅ `recommended` [config](https://github.com/sindresorhus/eslint-package-json#configs).

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->

Alphabetically sorted dependency lists are easier to scan and produce cleaner diffs when adding or removing packages.

npm agrees: it alphabetically re-sorts dependency groups itself whenever `npm install`/`npm uninstall` rewrites `package.json`, so an unsorted list only stays that way until the next install.

By default this rule checks `dependencies`, `devDependencies`, `optionalDependencies`, `peerDependencies`, and `peerDependenciesMeta`. The `scripts` field is intentionally excluded because lifecycle script order can be meaningful.

## Options

### `properties`

Type: `string[]`\
Default: `['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies', 'peerDependenciesMeta']`

Which object fields to check for alphabetical ordering.

```js
{
	'package-json/sort-dependencies': ['error', {
		properties: ['dependencies', 'devDependencies']
	}]
}
```

## Examples

```json
// ❌
{
	"dependencies": {
		"react": "^18.0.0",
		"lodash": "^4.0.0"
	}
}
```

```json
// ✅
{
	"dependencies": {
		"lodash": "^4.0.0",
		"react": "^18.0.0"
	}
}
```
