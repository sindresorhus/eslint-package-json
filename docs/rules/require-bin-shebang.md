# require-bin-shebang

📝 Require `bin` files to start with the exact `#!/usr/bin/env node` shebang.

💼 This rule is enabled in the ✅ `recommended` [config](https://github.com/sindresorhus/eslint-package-json#configs).

<!-- end auto-generated rule header -->
<!-- Do not manually modify this header. Run: `npm run fix:eslint-docs` -->

The `bin` field exposes executable commands to package consumers. JavaScript bin files must start with the exact shebang `#!/usr/bin/env node`, followed by a line feed or the end of the file, so Unix-like systems invoke them with Node.js.

This rule checks existing `.js`, `.mjs`, and `.cjs` files referenced by `bin`. Missing, unreadable, non-regular, unsupported, virtual, and out-of-package targets are ignored, as are symlinks that resolve outside the package and `directories.bin`. It does not check executable permissions. The filesystem check is best-effort and may race with concurrent changes to the package.

## Examples

The following package assumes that `cli.js` exists beside `package.json`. The JSON configuration is identical in both examples; only the referenced file contents differ.

```json
// ❌
{
	"bin": "cli.js"
}
```

Referenced `cli.js`:

```js
console.log('CLI');
```

```json
// ✅
{
	"bin": "cli.js"
}
```

Referenced `cli.js`:

```js
#!/usr/bin/env node
console.log('CLI');
```
