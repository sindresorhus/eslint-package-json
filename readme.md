# eslint-package-json

> Powerful ESLint rules for `package.json`

Lint and autofix your `package.json` files with ESLint, powered by [`@eslint/json`](https://github.com/eslint/json).

This plugin catches real `package.json` mistakes (invalid names, bad version ranges, broken `exports`, misplaced `@types/*`, redundant `files` entries, and more) and fixes many of them automatically.

## Install

```sh
npm install --save-dev eslint eslint-package-json
```

**Requires ESLint `>=10.4`, [flat config](https://eslint.org/docs/latest/use/configure/configuration-files), and [ESM](https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c#how-can-i-make-my-typescript-project-output-esm).**

## Usage

Add the recommended config to your `eslint.config.js`:

```js
import packageJson from 'eslint-package-json';

export default [
	packageJson.configs.recommended,
];
```

This lints every `package.json` in your project. To tweak individual rules, add a config block after the preset:

```js
import packageJson from 'eslint-package-json';

export default [
	packageJson.configs.recommended,
	{
		files: [
			'**/package.json'
		],
		rules: {
			'package-json/dependency-version-range': [
				'error',
				{
					range: 'caret'
				}
			]
		}
	}
];
```

If you prefer to wire it up manually instead of using a preset:

```js
import json from '@eslint/json';
import packageJson from 'eslint-package-json';

export default [
	{
		files: [
			'**/package.json'
		],
		language: 'json/json',
		plugins: {
			json,
			'package-json': packageJson
		},
		rules: {
			'package-json/valid-fields': 'error'
		}
	}
];
```

## Configs

- `recommended` — Enables the rules that catch real, uncontroversial mistakes.
- `all` — Enables every rule. Useful for discovering rules; not recommended for everyday use.

## Rules

<!-- begin auto-generated rules list -->

💼 [Configurations](https://github.com/sindresorhus/eslint-package-json#configs) enabled in.\
✅ Set in the `recommended` [configuration](https://github.com/sindresorhus/eslint-package-json#configs).\
🔧 Automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/user-guide/command-line-interface#--fix).\
💡 Manually fixable by [editor suggestions](https://eslint.org/docs/latest/use/core-concepts#rule-suggestions).

| Name                                                                                         | Description                                                                               | 💼 | 🔧 | 💡 |
| :------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------- | :- | :- | :- |
| [consistent-name-casing](docs/rules/consistent-name-casing.md)                               | Enforce kebab-case for keys in `scripts` and `bin` objects.                               |    |    |    |
| [consistent-path-prefix](docs/rules/consistent-path-prefix.md)                               | Enforce consistent `./` prefix on local path fields.                                      | ✅  | 🔧 |    |
| [dependency-version-range](docs/rules/dependency-version-range.md)                           | Enforce a consistent version range style for dependencies.                                | ✅  |    | 💡 |
| [description-format](docs/rules/description-format.md)                                       | Enforce formatting of the `description` field.                                            |    | 🔧 |    |
| [no-absolute-paths](docs/rules/no-absolute-paths.md)                                         | Disallow absolute paths in path fields.                                                   | ✅  |    |    |
| [no-backslash-paths](docs/rules/no-backslash-paths.md)                                       | Enforce forward slashes in path fields.                                                   | ✅  | 🔧 |    |
| [no-core-module-dependencies](docs/rules/no-core-module-dependencies.md)                     | Disallow dependencies that shadow Node.js built-in modules.                               | ✅  |    | 💡 |
| [no-deprecated-fields](docs/rules/no-deprecated-fields.md)                                   | Disallow fields and scripts that npm has deprecated.                                      | ✅  |    |    |
| [no-dist-tag-dependencies](docs/rules/no-dist-tag-dependencies.md)                           | Disallow dist-tags as dependency specifiers.                                              | ✅  |    |    |
| [no-duplicate-dependencies](docs/rules/no-duplicate-dependencies.md)                         | Disallow a dependency listed in multiple dependency groups.                               | ✅  | 🔧 |    |
| [no-empty-fields](docs/rules/no-empty-fields.md)                                             | Disallow empty fields.                                                                    | ✅  |    | 💡 |
| [no-exact-peer-dependencies](docs/rules/no-exact-peer-dependencies.md)                       | Disallow exact versions for peer dependencies.                                            |    |    | 💡 |
| [no-exports-trailing-slash](docs/rules/no-exports-trailing-slash.md)                         | Disallow deprecated trailing-slash folder mappings in `exports`/`imports`.                | ✅  | 🔧 |    |
| [no-git-dependencies](docs/rules/no-git-dependencies.md)                                     | Disallow git URLs as dependency specifiers.                                               |    |    |    |
| [no-http-dependencies](docs/rules/no-http-dependencies.md)                                   | Disallow HTTP URLs as dependency specifiers.                                              | ✅  |    |    |
| [no-install-scripts](docs/rules/no-install-scripts.md)                                       | Disallow `install` lifecycle scripts.                                                     | ✅  |    | 💡 |
| [no-local-dependencies](docs/rules/no-local-dependencies.md)                                 | Disallow local filesystem paths as dependency specifiers.                                 |    |    |    |
| [no-manual-maintainers](docs/rules/no-manual-maintainers.md)                                 | Disallow a manually-set `maintainers` field.                                              | ✅  |    | 💡 |
| [no-orphan-types](docs/rules/no-orphan-types.md)                                             | Disallow `@types/*` packages without a corresponding dependency.                          | ✅  |    | 💡 |
| [no-package-manager-engines](docs/rules/no-package-manager-engines.md)                       | Disallow package manager versions in the `engines` field.                                 | ✅  |    | 💡 |
| [no-pre-release-dependencies](docs/rules/no-pre-release-dependencies.md)                     | Disallow pre-release versions as dependency specifiers.                                   |    |    |    |
| [no-redundant-files](docs/rules/no-redundant-files.md)                                       | Disallow redundant entries in the `files` field.                                          | ✅  | 🔧 |    |
| [no-redundant-repository-fields](docs/rules/no-redundant-repository-fields.md)               | Disallow `bugs`/`homepage` values that duplicate what npm infers from `repository`.       |    | 🔧 |    |
| [no-restricted-dependencies](docs/rules/no-restricted-dependencies.md)                       | Disallow specific dependencies.                                                           |    |    |    |
| [no-restricted-fields](docs/rules/no-restricted-fields.md)                                   | Disallow specific fields.                                                                 |    |    | 💡 |
| [no-self-dependency](docs/rules/no-self-dependency.md)                                       | Disallow a package depending on itself.                                                   | ✅  |    | 💡 |
| [no-typo-fields](docs/rules/no-typo-fields.md)                                               | Disallow misspelled package.json field names.                                             | ✅  | 🔧 |    |
| [no-wildcard-dependencies](docs/rules/no-wildcard-dependencies.md)                           | Disallow wildcard version ranges for dependencies.                                        | ✅  |    |    |
| [peer-dependencies-as-dev-dependencies](docs/rules/peer-dependencies-as-dev-dependencies.md) | Enforce peer dependencies to also be listed in `devDependencies` at a compatible version. | ✅  |    | 💡 |
| [prefer-engines-range](docs/rules/prefer-engines-range.md)                                   | Prefer open-ended `>=` ranges in the `engines` field.                                     | ✅  |    | 💡 |
| [prefer-exports](docs/rules/prefer-exports.md)                                               | Prefer the `exports` field over legacy entry-point fields.                                | ✅  |    |    |
| [prefer-files-field](docs/rules/prefer-files-field.md)                                       | Require a `files` allowlist.                                                              | ✅  |    |    |
| [prefer-https-urls](docs/rules/prefer-https-urls.md)                                         | Prefer `https://` URLs in metadata fields.                                                | ✅  | 🔧 |    |
| [prefer-provenance](docs/rules/prefer-provenance.md)                                         | Enforce npm provenance via `publishConfig.provenance`.                                    |    |    | 💡 |
| [prefer-shorthand](docs/rules/prefer-shorthand.md)                                           | Prefer the shorthand string form of fields where possible.                                | ✅  | 🔧 |    |
| [prefer-type-module](docs/rules/prefer-type-module.md)                                       | Enforce the `type` field to be `module`.                                                  | ✅  |    | 💡 |
| [require-default-condition](docs/rules/require-default-condition.md)                         | Require a `default` entry in `exports`/`imports` conditions objects.                      | ✅  |    |    |
| [require-engines](docs/rules/require-engines.md)                                             | Require the `engines.node` field.                                                         | ✅  |    |    |
| [require-entry-point](docs/rules/require-entry-point.md)                                     | Require an entry point field.                                                             | ✅  |    |    |
| [require-exports-root](docs/rules/require-exports-root.md)                                   | Require a `.` root entry in the `exports` field.                                          |    |    |    |
| [require-fields](docs/rules/require-fields.md)                                               | Require specific fields to be present, always or only for published packages.             | ✅  |    |    |
| [require-private-when-workspaces](docs/rules/require-private-when-workspaces.md)             | Require `private` when `workspaces` is set.                                               | ✅  |    | 💡 |
| [require-types-in-exports](docs/rules/require-types-in-exports.md)                           | Enforce that types are exposed through the `exports` field.                               | ✅  |    |    |
| [restrict-fields-when-private](docs/rules/restrict-fields-when-private.md)                   | Disallow fields that have no effect when the package is private.                          |    |    | 💡 |
| [sort-dependencies](docs/rules/sort-dependencies.md)                                         | Enforce alphabetical ordering of dependencies.                                            | ✅  | 🔧 |    |
| [sort-properties](docs/rules/sort-properties.md)                                             | Enforce a canonical order for top-level package.json fields.                              | ✅  | 🔧 |    |
| [types-in-dev-dependencies](docs/rules/types-in-dev-dependencies.md)                         | Enforce `@types/*` packages to be in `devDependencies`.                                   |    |    | 💡 |
| [valid-fields](docs/rules/valid-fields.md)                                                   | Enforce valid values for package.json fields.                                             | ✅  | 🔧 | 💡 |

<!-- end auto-generated rules list -->

## FAQ

### How is this different from [`eslint-plugin-package-json`](https://github.com/michaelfaith/eslint-plugin-package-json)?

Both lint `package.json` through ESLint, and `eslint-plugin-package-json` is a great project. I built this because I wanted a different design:

- **Fewer, more powerful rules.** Instead of dozens of near-identical rules (one per field, one per dependency group), I use a handful of rules with options. For example, one `dependency-version-range` rule with a `dependencyTypes` option replaces a whole family of `no-caret-*` / `prefer-tilde-*` rules. Less to learn, less to configure.
- **Native [`@eslint/json`](https://github.com/eslint/json).** I target ESLint's official JSON language directly, with no parser compatibility layer.
- **Autofix-first.** Every rule that can safely fix or suggest a fix does.

### Why not [`npm-package-json-lint`](https://github.com/tclindner/npm-package-json-lint)?

It's a separate CLI with its own config format and no autofix. This plugin lives inside ESLint, so it shares your editor integration, `--fix`, disable comments, and config.

## Related

- [eslint-plugin-unicorn](https://github.com/sindresorhus/eslint-plugin-unicorn) — Lots of awesome ESLint rules.
- [eslint-node-test](https://github.com/sindresorhus/eslint-node-test) — ESLint rules for the Node.js built-in test runner.
