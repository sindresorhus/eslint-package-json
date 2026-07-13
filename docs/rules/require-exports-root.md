# require-exports-root

📝 Require a usable `.` root entry in the `exports` field.

<!-- end auto-generated rule header -->
<!-- Do not manually modify this header. Run: `npm run fix:eslint-docs` -->

Require an importable package root. Subpath maps need a usable `.` runtime entry, and when `main` exists, the root must expose it. String exports and top-level conditions objects already represent the root.

> [!NOTE]
> Some packages intentionally expose only subpaths and have no importable root. Disable the rule for those cases.

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
