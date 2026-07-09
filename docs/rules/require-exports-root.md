# require-exports-root

📝 Require a `.` root entry in the `exports` field.

<!-- end auto-generated rule header -->
<!-- Do not manually modify this header. Run: `npm run fix:eslint-docs` -->

When the `exports` field is a subpath map (its keys are subpaths like `./sub`) but has no `.` entry, the package has no main entry point and cannot be imported by its bare name (`import pkg from 'pkg'` fails). Add a `.` entry pointing to the package's main module.

A conditions object (keys like `import`/`require`/`default`) is itself the root entry, so it is not flagged. A string `exports` is also fine.

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
