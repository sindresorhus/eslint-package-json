# no-self-dependency

📝 Disallow a package depending on itself.

💼 This rule is enabled in the ✅ `recommended` [config](https://github.com/sindresorhus/eslint-package-json#configs).

💡 This rule is manually fixable by [editor suggestions](https://eslint.org/docs/latest/use/core-concepts#rule-suggestions).

<!-- end auto-generated rule header -->
<!-- Do not manually modify this header. Run: `npm run fix:eslint-docs` -->

A package must not list its own `name` in `dependencies`, `optionalDependencies`, or `peerDependencies` with a specifier npm resolves from the registry. It usually happens through a copy-paste slip or a stray entry in a monorepo, and npm will quietly install whatever unrelated package holds that name.

Two deliberate self-references are allowed:

- **`devDependencies`**, where self-hosting lives. TypeScript compiles itself with a published TypeScript, and an ESLint plugin lints itself with its own last release.
- **A local path**, in any group. `"foo": "file:."` makes npm symlink the package into its own `node_modules`, which is how a package dogfoods its published entry points.

Git and tarball self-references, and the yarn/pnpm `link:`, `portal:`, and `workspace:` protocols, are explicit choices too, so they are left alone.

## Examples

```json
// ❌
{
	"name": "foo",
	"dependencies": {
		"foo": "^1.0.0"
	}
}
```

```json
// ✅
{
	"name": "foo",
	"dependencies": {
		"bar": "^1.0.0"
	}
}
```

```json
// ✅ — a local path self-links the package so it can dogfood its own entry points.
{
	"name": "foo",
	"dependencies": {
		"foo": "file:."
	}
}
```

```json
// ✅ — self-hosting: build or lint with your own last published release.
{
	"name": "foo",
	"devDependencies": {
		"foo": "^1.0.0"
	}
}
```
