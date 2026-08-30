# no-absolute-paths-in-scripts

📝 Disallow absolute paths in scripts.

💼 This rule is enabled in the ✅ `recommended` [config](https://github.com/sindresorhus/eslint-package-json#configs).

<!-- end auto-generated rule header -->
<!-- Do not manually modify this header. Run: `npm run fix:eslint-docs` -->

Package scripts should not contain absolute paths. Absolute paths depend on a particular filesystem layout or operating system, so they break when the package is run elsewhere.

[npm runs scripts](https://docs.npmjs.com/cli/using-npm/scripts/) from the package root and adds dependency executables to `PATH`. Use paths relative to the package root for files, and invoke dependency executables by name.

This rule checks every effective string value in `scripts` for absolute POSIX and Windows paths, including executable paths, arguments, environment-variable assignment values, path lists, and redirection targets. Common URL forms are ignored.

Recognized URL-like spans and shell parameter expansions are ignored as lexical units. Absolute paths in those ignored portions, such as a path-list entry after a URL or a parameter fallback value, are not checked.

Slash-prefixed single-component words such as `/restore` and option prefixes such as `/Fo:` are ambiguous: POSIX treats them as absolute paths, while Windows tools commonly use them as options. To avoid false positives in cross-platform scripts, the rule ignores the ambiguous prefix and still checks any attached value. Paths with another separator, such as `/usr/bin`, are still reported.

Detection is lexical and independent of the configured script shell. Disable the rule for the package manifest when a script uses slash-prefixed shell syntax, such as a `sed` address, that is intentionally not a path.

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
