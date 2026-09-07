# no-node-modules-bin-paths

📝 Disallow direct `node_modules/.bin` paths in scripts.

💼 This rule is enabled in the ✅ `recommended` [config](https://github.com/sindresorhus/eslint-package-json#configs).

💡 This rule is manually fixable by [editor suggestions](https://eslint.org/docs/latest/use/core-concepts#rule-suggestions).

<!-- end auto-generated rule header -->
<!-- Do not manually modify this header. Run: `npm run fix:eslint-docs` -->

[npm adds dependency executables to `PATH`](https://docs.npmjs.com/cli/v11/using-npm/scripts/#path) when running package scripts. Use `eslint` instead of `node_modules/.bin/eslint` or `./node_modules/.bin/eslint`.

[pnpm provides the same behavior](https://pnpm.io/cli/run#details), and [Yarn Plug'n'Play does not create `node_modules/.bin`](https://yarnpkg.com/migration/pnp). Using binary names avoids depending on a particular installation layout.

This rule checks effective string values in `scripts`. It recognizes direct commands at the start of a script or after `&&`, `||`, `;`, `|`, `&`, or a newline, including leading environment assignments. Single-quoted and double-quoted paths and Windows backslashes are supported.

Paths used as arguments, assignments, or redirection targets are ignored. For example, `node --inspect node_modules/.bin/jest` needs a file path because Node does not resolve its script argument through `PATH`. Parent-relative, absolute, and nested package paths are also ignored because they may intentionally select a different installation.

Detection is lexical and limited to simple shell commands. The rule does not interpret command wrappers such as `cross-env` or `env`, commands preceded by redirections, nested shell strings, variable expansion, or compound shell syntax such as conditionals, loops, and here-documents.

The rule provides a suggestion to replace detected paths with binary names, preserving arguments and quoting. It does not autofix because changing the working directory or `PATH` can make the bare name resolve to a different executable. Disable the rule for scripts that intentionally select a specific executable.

## Examples

```json
// ❌
{
	"scripts": {
		"lint": "./node_modules/.bin/eslint ."
	}
}
```

```json
// ✅
{
	"scripts": {
		"lint": "eslint ."
	}
}
```

```json
// ❌
{
	"scripts": {
		"test": "NODE_ENV=test node_modules/.bin/jest && node_modules/.bin/eslint ."
	}
}
```

```json
// ✅
{
	"scripts": {
		"test": "NODE_ENV=test jest && eslint ."
	}
}
```

## Related rules

- [`no-absolute-paths-in-scripts`](./no-absolute-paths-in-scripts.md) checks absolute paths in commands and arguments. This rule checks local relative `.bin` command paths.
- [`valid-fields`](./valid-fields.md) validates the shape and value types of `scripts`.
- [`no-backslash-paths`](./no-backslash-paths.md) and [`consistent-path-prefix`](./consistent-path-prefix.md) check manifest path fields, not shell commands in `scripts`.
