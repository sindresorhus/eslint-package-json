# no-exact-peer-dependencies

📝 Disallow exact versions for peer dependencies.

💡 This rule is manually fixable by [editor suggestions](https://eslint.org/docs/latest/use/core-concepts#rule-suggestions).

<!-- end auto-generated rule header -->
<!-- Do not manually modify this header. Run: `npm run fix:eslint-docs` -->

Pinning a peer dependency to an exact version (for example `"react": "18.2.0"`) is an anti-pattern. Peer ranges should be as wide as your actual compatibility allows, because an exact pin makes your package impossible to install alongside any other package that needs a different patch or minor of the same peer. Use a range such as `^18.2.0` or `>=18`.

Suggestions are offered for both: a caret range from the pinned version, or a `>=` range from its major version.

> [!NOTE]
> A few packages intentionally pin a peer to a single version. Disable the rule for those cases.

## Examples

```json
// ❌
{
	"peerDependencies": {
		"react": "18.2.0"
	}
}
```

```json
// ✅
{
	"peerDependencies": {
		"react": "^18.2.0"
	}
}
```
