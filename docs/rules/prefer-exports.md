# prefer-exports

📝 Prefer an `exports`-first package interface.

💼 This rule is enabled in the ✅ `recommended` [config](https://github.com/sindresorhus/eslint-package-json#configs).

<!-- end auto-generated rule header -->
<!-- Do not manually modify this header. Run: `npm run fix:eslint-docs` -->

The `exports` field is the modern way to declare a package's entry points. It supports multiple entry points, conditional resolution (`import`/`require`/`types`/`browser`/…), and encapsulation, and it supersedes the legacy `main`, `module`, `browser`, `types`, and `typings` fields.

This rule flags those legacy fields and recommends defining entry points through `exports` instead. It flags a string-valued `browser` entry point, but leaves browser object mappings alone because their per-file replacements and `false` browser shims cannot be converted generically to an equivalent `exports` map.

A top-level `types`/`typings` field is especially worth moving: once `exports` is present, modern TypeScript module resolution (`node16`, `nodenext`, `bundler`) ignores the top-level `types` field and only reads a `types` condition inside `exports`. Keeping types in `exports` avoids that footgun entirely.

It is report-only: rewriting these fields into `exports` changes module and type resolution, so there is no autofix.

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
	"main": "./index.js"
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
