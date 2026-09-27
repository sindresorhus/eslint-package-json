# require-types-in-exports

📝 Require correctly ordered types in `exports`.

💼 This rule is enabled in the ✅ `recommended` [config](https://github.com/sindresorhus/eslint-package-json#configs).

<!-- end auto-generated rule header -->
<!-- Do not manually modify this header. Run: `npm run fix:eslint-docs` -->

When `exports` is present, modern TypeScript resolution reads types from it instead of the top-level `types`, `typings`, or `typesVersions` field. For packages that declare type metadata in any of these fields or in a type condition, this rule requires coverage for each exported JavaScript branch, validates `types` and `types@…` ordering and selectors, and checks that `types` points at a declaration file.

The rule resolves each subpath as TypeScript does for an ES module consumer, in both `nodenext` (conditions `types`, `node`, `import`) and `bundler` (`types`, `import`) modes, and reports a mode that finds no declaration. JavaScript that only `require` reaches needs no declaration. A declaration behind any other condition (`browser`, `worker`, …), or behind `node` in `bundler` mode, covers nothing. A type condition after a `default` target, or after an `import` or `node` target a mode reaches, is reported, since it is dead when that target has a declaration next to it.

This is static manifest analysis. Targets must be structurally valid, every well-formed `types@` range is assumed to match the running TypeScript, and file existence, publication, declaration contents, and custom TypeScript conditions (`customConditions`) are not checked. Use [`valid-fields`](valid-fields.md) for malformed targets and package-aware tools for published contents.

> [!NOTE]
> TypeScript can also pick up a declaration file sitting next to a JavaScript target, so `./index.js` resolves through `./index.d.ts` even with no `types` condition. That depends on which files exist, which this rule deliberately does not inspect, so such a package is still reported.

## Examples

```json
// ❌
{
	"types": "./index.d.ts",
	"exports": {
		"import": "./index.js",
		"require": "./index.cjs"
	}
}
```

```json
// ✅
{
	"types": "./index.d.ts",
	"exports": {
		"types": "./index.d.ts",
		"default": "./index.js"
	}
}
```
