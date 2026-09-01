# require-bin-executable

📝 Require `bin` files to be executable by their owner.

💼 This rule is enabled in the ✅ `recommended` [config](https://github.com/sindresorhus/eslint-package-json#configs).

<!-- end auto-generated rule header -->
<!-- Do not manually modify this header. Run: `npm run fix:eslint-docs` -->

The `bin` field exposes executable commands. This rule requires every existing regular file it references to have the Unix owner execute bit, regardless of extension. Git uses this bit to record files as executable.

Use `chmod u+x path/to/file` to set the permission. To also record the file as executable in Git's index, use `git update-index --chmod=+x path/to/file`; this does not change the working-tree mode checked by the rule. On filesystems without Unix permissions, the check is best-effort.

The rule does nothing on Windows. It ignores missing, inaccessible, non-regular, virtual, and out-of-package targets, symlinks resolving outside the package, and `directories.bin`.

## Examples

In both examples, `cli.js` exists beside `package.json`; only its permissions differ.

```json
// ❌
{
	"bin": "cli.js"
}
```

`cli.js` is `-rw-r--r--`.

```json
// ✅
{
	"bin": "cli.js"
}
```

`cli.js` is `-rwxr--r--`.
