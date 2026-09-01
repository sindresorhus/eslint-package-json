# no-absolute-paths-in-scripts

📝 Disallow absolute paths in scripts.

💼 This rule is enabled in the ✅ `recommended` [config](https://github.com/sindresorhus/eslint-package-json#configs).

<!-- end auto-generated rule header -->
<!-- Do not manually modify this header. Run: `npm run fix:eslint-docs` -->

Absolute paths make package scripts depend on a specific filesystem layout or operating system. [npm runs scripts](https://docs.npmjs.com/cli/using-npm/scripts/) from the package root and adds dependency executables to `PATH`, so use relative paths and bare executable names instead.

This rule checks effective string values in `scripts` for absolute POSIX and Windows paths in commands, arguments, assignments, path lists, and redirects. URL-like spans and simple shell parameter expansions are ignored, including any paths inside them.

To avoid confusing Windows options with POSIX paths, slash-prefixed single-component words like `/restore` and option prefixes like `/Fo:` are ignored, while attached values are checked. Multi-component paths like `/usr/bin` are reported.

Detection is lexical and shell-independent. Disable the rule when a script intentionally uses path-like syntax, such as a `sed` address.

## Examples

```json
// ❌
{
	"scripts": {
		"test": "/usr/bin/node /Users/me/project/test.js"
	}
}
```

```json
// ✅
{
	"scripts": {
		"test": "node ./test.js"
	}
}
```

```json
// ❌
{
	"scripts": {
		"build": "C:\\tools\\builder.exe ./source"
	}
}
```

```json
// ✅
{
	"scripts": {
		"build": "builder ./source"
	}
}
```
