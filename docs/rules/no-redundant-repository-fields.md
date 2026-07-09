# no-redundant-repository-fields

📝 Disallow `bugs`/`homepage` values that duplicate what npm infers from `repository`.

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->
<!-- Do not manually modify this header. Run: `npm run fix:eslint-docs` -->

When `repository` points at a known host (GitHub, GitLab, Bitbucket, a Gist, or sourcehut), npm infers `bugs` and `homepage` from it at publish time if they're not already set. An explicit value that exactly matches what npm would infer anyway is redundant boilerplate that can drift out of sync with `repository`.

Only an exact match is flagged, so a legitimately different `bugs`/`homepage` is never second-guessed. A `bugs` object with an `email` is left alone (removing it would drop the email), and so is a `repository.directory` (npm's inference ignores it, so a monorepo subpackage's value is likely intentional).

Removing a redundant field never changes what npm publishes, so this rule is autofixable.

## Examples

```json
// ❌
{
	"repository": "sindresorhus/type-fest",
	"bugs": "https://github.com/sindresorhus/type-fest/issues",
	"homepage": "https://github.com/sindresorhus/type-fest#readme"
}
```

```json
// ✅
{
	"repository": "sindresorhus/type-fest"
}
```

```json
// ✅
{
	"repository": "sindresorhus/type-fest",
	"bugs": "https://example.com/custom-tracker"
}
```
