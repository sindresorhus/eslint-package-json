# require-exports-root

📝 Require a usable `.` root entry in the `exports` field.

<!-- end auto-generated rule header -->
<!-- Do not manually modify this header. Run: `npm run fix:eslint-docs` -->

Require an importable package root. Subpath maps need a usable `.` runtime entry, and when `main` exists, the root must expose it. String exports and top-level conditions objects already represent the root.

> [!NOTE]
> Some packages intentionally expose only subpaths and have no importable root. Disable the rule for those cases.
>
> A types-only package such as [`type-fest`](https://www.npmjs.com/package/type-fest), whose `exports` carry nothing but `types` conditions, is likewise reported as having no runtime entry point. That shape is indistinguishable from a package that simply forgot one, so leave the rule off for types-only packages.

`main` is compared textually after normalizing a leading `./`, except that an extensionless `main` also matches the paths Node's CommonJS extension search would find: `"main": "index"` is satisfied by `./index.js`, and `"main": "lib"` by `./lib/index.js`.

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
