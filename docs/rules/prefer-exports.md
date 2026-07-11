# prefer-exports

📝 Prefer the `exports` field over legacy entry-point fields.

<!-- end auto-generated rule header -->
<!-- Do not manually modify this header. Run: `npm run fix:eslint-docs` -->

The `exports` field is the modern way to declare a package's entry points. It supports multiple entry points, conditional resolution (`import`/`require`/`types`/`browser`/…), and encapsulation.

This rule prefers an `exports`-first package interface over the `main`, `module`, `browser`, `types`, and `typings` fields. It flags them even when `exports` is already defined. Keeping the package's public entry points in `exports` makes its resolution behavior explicit and self-contained.

This is an opinionated rule. `main` can provide compatibility for older tooling, TypeScript recommends a top-level `types` field so npm displays its TypeScript badge, and object-form `browser` fields can replace internal modules in ways `exports` does not model. Enable this rule when a single `exports` declaration matters more than those compatibility mechanisms.

It is report-only: removing these fields can change package resolution, type discovery, or browser bundling, so there is no autofix.

## Examples

```json
// ❌
{
	"main": "./index.js",
	"types": "./index.d.ts"
}
```

```json
// ❌
{
	"exports": "./index.js",
	"main": "./index.js",
	"types": "./index.d.ts",
	"browser": {
		"./server.js": "./browser.js"
	}
}
```

```json
// ✅
{
	"exports": {
		"types": "./index.d.ts",
		"default": "./index.js"
	}
}
```
