# valid-fields

📝 Enforce valid values for package.json fields.

💼 This rule is enabled in the ✅ `recommended` [config](https://github.com/sindresorhus/eslint-package-json#configs).

🔧💡 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix) and manually fixable by [editor suggestions](https://eslint.org/docs/latest/use/core-concepts#rule-suggestions).

<!-- end auto-generated rule header -->

Validate the structure and values of individual `package.json` fields when they are present. Most checks catch what npm or Node reject or silently drop; a few, like the `keywords` style checks, are conventions. None take options, so they live together in one rule. Checks that need options have their own dedicated rules instead.

Each field is validated only when it exists; use [`require-fields`](require-fields.md) to enforce presence.

An empty top-level field (`""`, `{}`, or `[]`) is left to [`no-empty-fields`](no-empty-fields.md), except an empty `keywords` string, which npm reads as one empty keyword.

Semantic checks include repository URLs and `exports`/`imports` targets. Some checks that are not obvious:

- `bugs`: a string must be a URL or an email address, and an object must hold a URL in `url` and an email address in `email`, since npm silently drops anything else. The old `web` and `name` aliases for `url` are not supported.
- `funding`: each URL needs an `http:` or `https:` host, since `npm fund` drops the whole field when one entry holds anything else.
- `exports`/`imports` targets: `.`, `..`, and `node_modules` segments are rejected, even percent-encoded.
- `imports`: a `#` key nested in a conditions object is reported, since Node reads it as a condition name.
- `readme`: a truthy value must be a string, since npm calls `.trim()` on it when publishing.
- `contributors` and `maintainers`: each entry must be a person, since a `null` entry makes npm throw.
- `license` and `licence`: a custom `LicenseRef` or `DocumentRef` is reported, since npm does not count it as valid. `licence` is checked when `license` is missing or falsy, since npm reads it then.
- `workspaces`: an object must hold its globs in a `packages` array.
- `os` and `cpu`: `any` is only valid as the sole value, since npm otherwise compares it as a platform name.
- `keywords`: a string is split on `/,\s+/` like npm does, and each part is checked.
- `devEngines`: keys must be `runtime`, `packageManager`, `cpu`, `os`, or `libc`, and each entry may hold only `name`, `version`, and `onFail`, since npm otherwise refuses to install or run scripts in the project.
- `engines`: a truthy value must be a string, since `--engine-strict` fails on anything else.
- `homepage`: a value without a scheme is reported, since npm publishes it as `http://`. Paths such as `.` or `/myapp` (Create React App) are left alone.
- `private`: must be a boolean, since `"false"` is truthy and blocks publishing.
- `packageManager`: must be a string.
- `peerDependenciesMeta`: an entry without a `peerDependencies` entry is reported, unless it is `"optional": true`.

Condition ordering and type coverage belong to [`require-default-condition`](require-default-condition.md) and [`require-types-in-exports`](require-types-in-exports.md). Legacy entry-point fields (`main`, `module`, `browser`, `types`, and `typings`) are intentionally ignored.

The following fields are validated:

- `name`
- `version`
- `private`
- `description`
- `readme`
- `license`
- `licence`
- `repository`
- `homepage`
- `bugs`
- `funding`
- `author`
- `contributors`
- `maintainers`
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
- `bundleDependencies`
- `overrides`

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
		"default": 123
	}
}
```

```json
// ✅
{
	"exports": {
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
