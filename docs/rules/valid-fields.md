# valid-fields

📝 Enforce valid values for package.json fields.

💼 This rule is enabled in the ✅ `recommended` [config](https://github.com/sindresorhus/eslint-package-json#configs).

🔧💡 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix) and manually fixable by [editor suggestions](https://eslint.org/docs/latest/use/core-concepts#rule-suggestions).

<!-- end auto-generated rule header -->

Validate the structure and values of individual `package.json` fields when they are present. Each check is objective correctness with no options and nothing to opt out of, so they live together in one rule. Fields that need options or encode an opinion have their own dedicated rules instead.

Each field is validated only when it exists; use [`require-fields`](require-fields.md) to enforce presence.

The following fields are validated:

- `name`
- `version`
- `private`
- `description`
- `license`
- `repository`
- `homepage`
- `bugs`
- `funding`
- `author`
- `contributors`
- `type`
- `exports`
- `imports`
- `bin`
- `man`
- `sideEffects`
- `engines`
- `devEngines`
- `os`
- `cpu`
- `publishConfig`
- `packageManager`
- `scripts`
- `files`
- `workspaces`
- `keywords`
- `dependencies`
- `devDependencies`
- `optionalDependencies`
- `peerDependencies`
- `peerDependenciesMeta`
- `bundledDependencies`
- `overrides`

In `peerDependenciesMeta`, `optional` only changes npm's behavior when it is `true`. Setting it to `false` is redundant and is removed automatically.

## Examples

```json
// ❌
{
	"name": "My-Package",
	"version": "v1.0.0",
	"license": "MITT"
}
```

```json
// ✅
{
	"name": "my-package",
	"version": "1.0.0",
	"license": "MIT"
}
```

```json
// ❌
{
	"exports": {
		"default": "./index.js",
		"import": "./index.mjs"
	}
}
```

```json
// ✅
{
	"exports": {
		"types": "./index.d.ts",
		"import": "./index.mjs",
		"default": "./index.js"
	}
}
```

```json
// ❌
{
	"engines": {
		"node": ">=18 || garbage"
	}
}
```

```json
// ✅
{
	"engines": {
		"node": "^18.0.0 || ^20.0.0"
	}
}
```

```json
// ❌
{
	"peerDependencies": {
		"react": "^19.0.0"
	},
	"peerDependenciesMeta": {
		"react": {
			"optional": false
		}
	}
}
```

```json
// ✅
{
	"peerDependencies": {
		"react": "^19.0.0"
	},
	"peerDependenciesMeta": {
		"react": {}
	}
}
```
