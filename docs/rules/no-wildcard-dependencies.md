# no-wildcard-dependencies

📝 Disallow wildcard version ranges for dependencies.

💼 This rule is enabled in the ✅ `recommended` [config](https://github.com/sindresorhus/eslint-package-json#configs).

<!-- end auto-generated rule header -->
<!-- Do not manually modify this header. Run: `npm run fix:eslint-docs` -->

A wildcard range (`*`, `""`, `x`, or `X`) matches any published version, so an install can silently pull in an untested, breaking, or even malicious new release. It also makes builds non-reproducible. Pin dependencies to an explicit version range instead.

`peerDependencies` are not checked by default, since `*` is a common and legitimate peer range (the consumer chooses the version). Use the `dependencyTypes` option to change which groups are checked.

It is report-only: there is no safe version to autofix to.

## Options

### `dependencyTypes`

Type: `string[]`\
Default: `['dependencies', 'devDependencies', 'optionalDependencies']`

The dependency groups to check.

```js
{
	'package-json/no-wildcard-dependencies': [
		'error',
		{
			dependencyTypes: [
				'dependencies',
				'peerDependencies'
			]
		}
	]
}
```

### `ignore`

Type: `string[]`\
Default: `[]`

Package names to skip.

```js
{
	'package-json/no-wildcard-dependencies': [
		'error', {
			ignore: [
				'some-wildcard-package'
			]
		}
	]
}
```

## Examples

```json
// ❌
{
	"dependencies": {
		"foo": "*"
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
