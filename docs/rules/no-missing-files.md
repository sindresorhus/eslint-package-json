# no-missing-files

📝 Disallow missing files referenced by package metadata.

<!-- end auto-generated rule header -->

This rule checks that local `exports` and `imports` targets, `bin` targets, and positive `files` patterns exist under the package root. Matching is case-sensitive, even on case-insensitive filesystems.

Run ESLint after building when package metadata references generated files.

For `exports` and `imports`, conditional branches are checked independently. An array is not a fallback list: Node stops at the first element that yields a target path, and a missing file there is a hard failure rather than a cue to try the next element, so that element is the one checked. Elements that may yield no target at all — `null`, a target outside the package, or a conditions object whose only keys are inactive for the consumer — let a later element apply, so the rest of the array is examined too and nothing is reported unless none of the elements resolve. Resolution assumes an ES module consumer, so `require` is skipped. A `*` target may match nested path segments and needs to match only one file. Under a key with no `*`, a `*` in the target is literal, and npm packs no path holding one, so it is reported. Other glob characters are literal, and directories are invalid targets. A target holding `%`, `?`, or `#` is skipped, since Node reads targets as URLs.

For `files`, entries may match files or directories, following npm 12:

- One leading `./` or `/` and any trailing slashes are stripped, so `/dist/` is `dist`, and `./`, `/`, `.`, and `./.` publish nothing and are reported.
- Brace groups are expanded. A pattern that takes more than 256 brace groups to expand, counting each group again in every alternative, is skipped.
- Entries with a character class (`[ab]`), an extglob (`@(a|b)`), or `..` are skipped, and so are negated entries.
- Every segment before the last must be a directory, so `a/*` is reported when `a` is a file.
- Symbolic links, empty directories, and files npm never packs (such as `node_modules`, lockfiles, `.git`, or files an `.npmignore` excludes) are not reported.

This is not a complete npm packlist check; use `npm pack --dry-run` to verify package contents.

Malformed values are ignored. A `bin` target holding `\` or `:` is skipped, since npm reads either as a path separator. The rule does not check custom metadata, bare `imports` specifiers (files in a dependency), or legacy fields such as `main`, `module`, `browser`, `types`, `typings`, `es2015`, `jsnext:main`, `man`, and `directories`.

## Examples

```json
// ❌ — Node stops at `./missing.js` and fails; it does not try `./index.js`.
{
	"exports": {
		".": [
			"./missing.js",
			"./index.js"
		]
	}
}
```

```json
// ✅ — the first element exists, so Node never needs a later one.
{
	"exports": {
		".": [
			"./index.js",
			"./missing.js"
		]
	}
}
```

```json
// ❌ — `default` always matches, so `./index.js` is unreachable.
{
	"exports": {
		".": [
			{
				"default": "./missing.js"
			},
			"./index.js"
		]
	}
}
```

```json
// ✅ — the `default` target exists, so nothing after it needs to be reachable.
{
	"exports": {
		".": [
			{
				"default": "./index.js"
			}
		]
	}
}
```

```json
// ❌
{
	"exports": "./missing.js"
}
```

```json
// ✅
{
	"exports": "./index.js"
}
```

```json
// ❌
{
	"exports": {
		"./feature/*": "./missing/*.js"
	}
}
```

```json
// ✅
{
	"exports": {
		"./rules/*": "./rules/*.js"
	}
}
```

```json
// ✅ (after the build has created `dist/index.js`)
{
	"exports": "./dist/index.js",
	"files": ["dist"]
}
```

```json
// ❌
{
	"files": [
		"missing"
	]
}
```

```json
// ✅
{
	"files": [
		"rules/*.js"
	]
}
```

```json
// ✅
{
	"files": [
		"dist",
		"!dist/**/*.test.js"
	]
}
```

```json
// ❌
{
	"name": "package-json",
	"bin": "./missing-cli.js"
}
```

```json
// ✅
{
	"name": "package-json",
	"bin": "./index.js"
}
```

```json
// ✅
{
	"main": "./missing.js",
	"types": "./missing.d.ts"
}
```
