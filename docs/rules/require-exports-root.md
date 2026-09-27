# require-exports-root

📝 Require a usable `.` root entry in the `exports` field.

<!-- end auto-generated rule header -->
<!-- Do not manually modify this header. Run: `npm run fix:eslint-docs` -->

Require an importable package root. Subpath maps need a usable `.` runtime entry, and when `main` exists, the root must expose it. String exports and top-level conditions objects already represent the root.

> [!NOTE]
> Some packages intentionally expose only subpaths and have no importable root. Disable the rule for those cases.
>
> A types-only package such as [`type-fest`](https://www.npmjs.com/package/type-fest), whose `exports` carry nothing but `types` conditions, is likewise reported as having no runtime entry point, and so is a root behind conditions Node never sets on its own, such as `browser`. Both look like a forgotten root, so leave the rule off for them.

`main` is compared textually after normalizing a leading `./`, except that an extensionless `main` also matches the paths Node's CommonJS extension search would find: `"main": "index"` is satisfied by `./index.js`, and `"main": "lib"` by `./lib/index.js`. The target can sit under any condition, so a `main` that names the `browser` target is not reported.

## Examples

```json
// ❌
{
	"exports": {
		"./sub": "./sub.js"
	}
}
```

```json
// ✅
{
	"exports": {
		".": "./index.js",
		"./sub": "./sub.js"
	}
}
```
