# require-bin-executable

📝 Require `bin` files to be executable by their owner.

💼 This rule is enabled in the ✅ `recommended` [config](https://github.com/sindresorhus/eslint-package-json#configs).

<!-- end auto-generated rule header -->
<!-- Do not manually modify this header. Run: `npm run fix:eslint-docs` -->

The `bin` field exposes executable commands to package consumers. This rule checks that each existing regular file referenced by `bin` has its Unix owner execute bit set, regardless of its extension. Git uses this bit to determine whether a file is recorded as executable.

Run `chmod u+x path/to/file` to make a file executable by its owner. To record the file as executable in Git's index, use `git update-index --chmod=+x path/to/file`.

The rule inspects working-tree filesystem metadata and does not read Git's index. On filesystems that do not preserve Unix permissions, the rule is best-effort because Node.js may expose synthesized modes, and `git update-index` does not change the mode observed by the rule.

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

Referenced `cli.js` is executable by its owner (`-rwxr--r--`).
