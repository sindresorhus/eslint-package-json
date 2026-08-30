# require-bin-executable

📝 Require `bin` files to have Unix executable permission.

💼 This rule is enabled in the ✅ `recommended` [config](https://github.com/sindresorhus/eslint-package-json#configs).

<!-- end auto-generated rule header -->
<!-- Do not manually modify this header. Run: `npm run fix:eslint-docs` -->

The `bin` field exposes executable commands to package consumers. This rule checks that each existing regular file referenced by `bin` has at least one Unix execute bit set, regardless of its extension.

Run `chmod +x path/to/file` to make a file executable. On a filesystem that does not preserve Unix permissions, record the executable bit in Git with `git update-index --chmod=+x path/to/file`.

The rule does nothing on Windows because Node.js cannot observe Unix execute permissions there. Missing, inaccessible, non-regular, virtual, and out-of-package targets are ignored, as are symlinks that resolve outside the package and `directories.bin`.

## Examples

The following package assumes that `cli.js` exists beside `package.json`. The JSON configuration is identical in both examples; only the referenced file permissions differ.

```json
// ❌
{
	"bin": "cli.js"
}
```

Referenced `cli.js` is not executable (`-rw-r--r--`).

```json
// ✅
{
	"bin": "cli.js"
}
```

Referenced `cli.js` is executable (`-rwxr-xr-x`).
