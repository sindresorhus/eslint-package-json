# sort-properties

📝 Enforce a canonical order for top-level package.json fields.

💼 This rule is enabled in the ✅ `recommended` [config](https://github.com/sindresorhus/eslint-package-json#configs).

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->

Keeping top-level `package.json` fields in a predictable order makes files easier to read and diff. This rule enforces a canonical order covering all common fields.

Keys not in the canonical list are placed after the known keys, in their original relative order.

## Options

### `order`

Type: `string[]`\
Default: `['name', 'version', 'private', 'description', 'license', 'repository', 'homepage', 'bugs', 'funding', 'author', 'contributors', 'maintainers', 'type', 'exports', 'imports', 'main', 'module', 'browser', 'types', 'typings', 'bin', 'man', 'directories', 'sideEffects', 'engines', 'devEngines', 'os', 'cpu', 'publishConfig', 'packageManager', 'scripts', 'config', 'files', 'workspaces', 'keywords', 'dependencies', 'devDependencies', 'peerDependencies', 'peerDependenciesMeta', 'optionalDependencies', 'bundledDependencies', 'overrides']`

Override the canonical key order with a custom list.

```js
{
	'package-json/sort-properties': ['error', {
		order: ['name', 'version', 'scripts', 'dependencies', 'devDependencies']
	}]
}
```

## Examples

```json
// ❌
{
	"version": "1.0.0",
	"name": "my-package"
}
```

```json
// ✅
{
	"name": "my-package",
	"version": "1.0.0"
}
```
