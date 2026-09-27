# Agents

## Philosophy

Keep rules simple and high-signal. Target common, real `package.json` mistakes. Skip rare edge cases rather than overcomplicating a rule. Prefer few powerful parameterized rules over many near-identical ones (one `dependency-version-range` with a `dependencyTypes` option, not a `no-caret-*` rule per dependency group).

This plugin lints `package.json` via [`@eslint/json`](https://github.com/eslint/json). Rules visit the JSON AST (momoa), not JavaScript.

Rules model the latest npm major (currently npm 12). Where majors differ, follow the latest one and verify claims against it, for example with `npm pack --dry-run`.

Rules target ESM packages. Do not add checks, branches, or tests for CommonJS consumers or CommonJS-specific mistakes (such as a `require` condition's types or a CommonJS declaration's format).

## Rule anatomy

Each rule is a plain ESLint rule: a module default-exporting `{create, meta}`. `create(context)` returns a standard ESLint visitor object.

Most rules operate on the top-level object:

```js
import {getRootObject, findMember} from './utils/index.js';

const MESSAGE_ID = 'rule-name';

const messages = {
	[MESSAGE_ID]: 'Message with {{placeholder}}.',
};

/** @param {import('eslint').Rule.RuleContext} context */
const create = context => ({
	Document(node) {
		const root = getRootObject(node);

		if (!root) {
			return;
		}

		const member = findMember(root, 'name');

		if (member?.value.type !== 'String') {
			return;
		}

		context.report({
			node: member.value,
			messageId: MESSAGE_ID,
			data: {placeholder: member.value.value},
		});
	},
});

/** @type {import('eslint').Rule.RuleModule} */
const config = {
	create,
	meta: {
		type: 'problem', // or 'suggestion'
		languages: ['json/json'],
		docs: {
			description: 'Enforce ….', // Ends with a period.
			recommended: true, // boolean — see below
		},
		fixable: 'code', // omit if no autofix; add `hasSuggestions: true` for suggestions
		schema: [],
		messages,
	},
};

export default config;
```

`meta.docs.url` is injected centrally in `index.js`; do not set it per rule.

### momoa JSON AST

- `Document.body` is the root value node. `getRootObject(document)` returns the top-level `Object` (or `undefined`).
- `Object` has `members: Member[]`. `Member` has `name` (a `String` node in strict JSON) and `value` (any value node). `getKey(member)` returns the key string.
- `Array` has `elements: Element[]`; `Element` has `value`. Note: `Element` nodes do not carry a `range` — use `element.value` for token/range lookups.
- Value nodes: `String{value}`, `Number{value}`, `Boolean{value}`, `Null`, `Object`, `Array`.
- `context.sourceCode`: `getText(node[, -1, -1] to strip quotes)`, `getRange`, `getLoc`, `getParent`, `getTokenBefore`/`getTokenAfter` (tokens include `{type: 'Comma'}`).
- There is no `eslint-utils` equivalent (JSON has no scopes or expressions).

### `recommended` config level

`meta.docs.recommended` is a boolean. `true` puts the rule in the `recommended` config (reserve for uncontroversial correctness rules). `false` keeps it out (opinionated/stylistic/opt-in rules); it is still in `all`. When unsure, default to `false` and ask.

### Option naming

Name boolean options in the positive `check*` form, never the negated `ignore*`/`skip*`. This does not apply to array/pattern options like `ignore` (a list to ignore), which follow ESLint's conventions. Read options defensively: `const {ignore = []} = context.options[0] ?? {};`.

### Helper naming

- `is*`/`has*`/`should*` return booleans (prefer explicit `false`).
- `get*` returns a value or `undefined`.
- Keep simple/rule-specific helpers local to the rule file. Only promote to `rules/utils/` when clearly general.

## Reusable utilities

`rules/utils/index.js` provides:

- `getRootObject(document)`, `findMember(object, key)`, `getKey(member)` — AST navigation.
- `iterateEffectiveMembers(object)` / `countEffectiveMembers(object)` / `withoutShadowedMembers(node)` — the object as `JSON.parse` builds it, one member per key. See “Duplicate keys” below.
- `iterateDependencies(root, types?)` — yields `{groupName, group, member, name}` across dependency groups.
- `dependencyTypes` — the four standard dependency group names.
- `isPrivatePackage(root)` — whether the package has `"private": true`. `isFalsyValue(node)` — whether a value node is falsy the way npm's `||` and `!` read it (`null`, `false`, `0`, `""`).
- `removeMember`/`removeMemberAndDuplicates`/`removeShadowedDuplicates`/`removeMembers`/`removeElement`/`removeEntryAndEmptyContainer` — comma-aware removal (generators yielding fixes). See “Duplicate keys” below for which to use.
- `buildReordered(sourceCode, container, orderedNodes)` + `isSameOrder` — for sorting fixes on objects or arrays that preserve indentation. Pass an object's members, or an array's element values (`Element` nodes carry no range).
- `compareStrings` — locale-independent alphabetical comparison. Always use it instead of `String#localeCompare`, whose locale-dependent result would make a fix disagree between a contributor and CI.
- `iterateStringValues(node)` — every `String` value node in an `exports`/`imports` tree; `iteratePathValueNodes(root)` yields `{node, field}` across every path-bearing field, since the same text means different things per field (a leading `/` is absolute in `main`, redundant in a `files` pattern).
- `insertRootField(fixer, sourceCode, root, {key, value})` — add a top-level field where a sorted document holds it, so `sort-properties` does not report the result. Use it instead of appending. It ranks by the default `fieldOrder`, so a document sorted with a custom `sort-properties` `order` can get the field in a place that order reports. `getRootFieldAnchor(root, key)` is the member it inserts after.
- `insertMember(fixer, sourceCode, object, {index, entry})` — insert a member into any object at a given index, keeping its layout (one-line, multiline, empty).
- `insertGroupMember(fixer, sourceCode, root, {groupMember, groupName, key, value})` — add an entry to a dependency-style group where a sorted document holds it, creating the group with `insertRootField` when it is missing. `setPrivate(fixer, sourceCode, root, privateMember)` — set `"private": true`, adding the field when it is missing.
- `getIndentString` — detect the file's indentation. `lineIndentOf(sourceCode, node)` — the indentation of the line a node starts on. `getIndentPrefix(sourceCode, node)` — the same, or `''` when the node shares its line with earlier content.
- `validRange`/`validVersion` — memoized `semver.validRange`/`semver.valid`. Use them instead of calling `semver` per entry.
- `canonicalVersion(version)` — the spelling of a version without its whitespace and leading `=`/`v`, keeping `+build`. `targetsPrerelease(range, {loose?})` — whether a range starts at a pre-release, the way `semver.minVersion` decides it.
- `resolveAlias(specifier)` — the package and range an `npm:` alias installs, via `npm-package-arg`. `installedSpecifier(specifier)` — the specifier npm installs for a dependency entry (an alias's own range, anything else unchanged). `isGitRemote(specifier)` — whether npm resolves a specifier to a git remote.
- `optionsSchema(properties)` + `stringArraySchema` — build a rule's options schema without boilerplate.

Import from `'./utils/index.js'`.

External: `semver`, `validate-npm-package-name`, `spdx-expression-parse`, `detect-indent`, `hosted-git-info`, `npm-package-arg`.

### Duplicate keys

`findMember` resolves a key to its *final* member, matching `JSON.parse`. Which remover a fix needs follows from that:

- `removeMemberAndDuplicates` — the rule found the field with `findMember` and deletes it. Deleting only the final member promotes an earlier duplicate into its place, so the reported problem would survive its own fix.
- `removeMember` — the rule iterates members and reports each one separately (`no-empty-fields`, `no-duplicate-dependencies`), so each suggestion should remove only its own member. The distinction is per report, not per rule.
- `removeEntryAndEmptyContainer` — the rule found a container with `findMember` and deletes one entry of it (a dependency, a keyword, a `publishConfig` key). It removes the whole container when that entry is its only one, since an empty container is what `no-empty-fields` reports, and it removes the entry together with its duplicates. So it is only for an entry reached through the effective members, not for a per-entry report on raw `.members`.
- `removeShadowedDuplicates` — the fix rewrites the effective member instead of deleting it, by renaming its key or replacing it with a member under a different key (`no-manual-maintainers`, `no-package-manager-engines`, the group rename in `types-in-dev-dependencies`). It drops the earlier duplicates and leaves the rewritten member alone.
- `removeMembers` — removing several members, a contiguous run at a time. The member removers above are built on it, so call it directly only to remove members that are not one key and its duplicates. One at a time does not work: each removal also consumes an adjacent comma, so neighboring members produce overlapping ranges and ESLint rejects the report with `Fix objects must not be overlapped`.

`test/package.js` enforces this on its tricky documents, which reach every rule with suggestions: every suggestion must reduce the number of reports of its own `messageId`, so a fix that only unmasks a shadowed duplicate fails the suite. A per-entry removal that also takes the effective duplicate still reduces that count, so the test does not catch the wrong remover in that direction.

Duplicates matter for *reports* too, and the dividing line is what the rule is asking:

- Asking what the manifest **means** — does this target resolve, which condition matches, is `url` the only field — must go through the effective members, since a shadowed duplicate is not part of the object npm and Node see, and answering from one makes the rule declare a broken manifest fine. Use `iterateEffectiveMembers(object)` for one object, or `withoutShadowedMembers(node)` to collapse a whole `exports`/`imports` subtree at the rule's entry point (`require-types-in-exports`, `no-missing-files`). Collapsing at the boundary leaves the traversal unchanged, and the surviving nodes are the originals, so reports still point at real source ranges.
- Reporting on **each entry the author wrote** — an empty field, a duplicated dependency, a typo'd key — should keep using plain `.members`. Extra reports on a document that already has duplicate keys are fine; `json/no-duplicate-keys` flags the underlying problem anyway.

## Autofix

Provide an autofix only if it cannot change install/runtime behavior. If it could (e.g. changing a version range, reordering `exports` conditions, moving a dependency between groups), provide a `suggest` instead and set `hasSuggestions: true`.

- Build replacement strings with `JSON.stringify(value)` so quoting/escaping is correct.
- Strict JSON has no trailing commas — handle comma tokens manually when adding/removing members or array elements (`removeMember` does this for object members).
- Whole-object reordering fixes must preserve the file's real indentation (read it from the source, or use `getIndentString`), and they break lines with `\n`.
- Strict JSON has no comments, so fixes never need to preserve them.

## Line endings

Treat every document as `LF`, and a fix normalizes to it: build a separator with `'\n'` and there is no `getNewline` helper. `CRLF` and a bare `CR` are not a concern — do not add code, branches, or tests to detect them, to pick a separator for them, or to preserve them. Write files with `LF` and read them as `LF`, and let npm and Node make of a `CRLF` file what they make of it.

## Rule naming

- `no-` — disallow something (`no-empty-fields`, `no-git-dependencies`).
- `prefer-` — suggest a better alternative (`prefer-provenance`).
- `require-` — mandate presence (`require-fields`).
- `consistent-` — enforce a single style (`consistent-path-prefix`).
- `valid-` — validate a field's structure/value. Option-less field checks live together in `valid-fields`, mostly what npm or Node reject or silently drop (the `keywords` conventions are the exception); give a field its own `valid-` rule only when it needs options or encodes a larger opinion.

Name after the target, not the fix. Use backticks around rule and option names in commit messages.

## Auto-generated files

- `rules/index.js` is generated — never edit by hand. Run `npm run create-rules-index-file` after adding/removing a rule.
- Doc headers in `docs/rules/<rule>.md` (everything above `<!-- end auto-generated rule header -->`) and the `readme.md` rules table are generated by `eslint-doc-generator`. Run `npm run fix:eslint-docs`.

On rebase, `rules/index.js` and the `readme.md` rules table almost always conflict because other rules were added meanwhile. Don't hand-resolve `rules/index.js` — take either side, then run `npm run create-rules-index-file`. For the `readme.md` table, keep both rows and re-sort alphabetically (or just run `npm run fix:eslint-docs`).

## Documentation

Write the prose in `docs/rules/<rule>.md` below the `<!-- end auto-generated rule header -->` line; everything above it is generated.

- Keep the `## Examples` heading. Show failing and passing cases in separate `json` fenced code blocks, each labelled with a `// ❌` or `// ✅` comment on the first line. Pair each fail with its passing counterpart.
- When a rule has options, add a `## Options` section with a `### optionName` subsection per option, each giving `Type:` and `Default:` (use a trailing `\` for the line break), then prose. Lead the relevant examples with the option context (e.g. `With {range: 'caret'} (the default):`).
- Write rule-configuration snippets in JavaScript, not JSON. When a rule has options, put the severity, options object, and nested arrays on separate lines, with trailing commas:

```js
'package-json/rule': [
	'error',
	{
		ignore: [
			'example',
		],
	},
]
```

- Keep the readme rule description and the `meta.docs.description` in sync.

## Testing

Tests use the built-in [`node:test`](https://nodejs.org/api/test.html) runner with its snapshot support (`node --test --experimental-test-snapshots`) and `node:assert/strict`. Rule tests use `getTester(import.meta)`, which derives the rule from the test filename and renders code-frame snapshots into `test/snapshots/<rule>.js.snapshot`:

```js
import {getTester} from './utils/test.js';

const {test} = getTester(import.meta);

test.snapshot({
	valid: ['{"name": "foo"}'],
	invalid: ['{"name": "Foo"}'],
});
```

Test cases are single-quoted JS strings containing JSON. Use `{code, options: [...]}` for option cases. For autofix/suggestion rules that rewrite structure, include multiline JSON inputs so the snapshot proves formatting is preserved. Cover matching and non-matching cases, every option, and edge cases the rule intentionally ignores (non-string values, missing fields).

`test/package.js` is a meta-test (plain `node:test` + `node:assert/strict`) asserting rule↔doc↔test↔config consistency, well-formed `meta`, and that no rule crashes on a non-object root. It runs automatically and should stay green.

It also runs every rule at once over two corpora, where cross-rule problems surface that a rule's own tests cannot:

- **The installed dependency tree** — a few hundred manifests people actually wrote. Real data is what caught `no-absolute-paths` calling `"files": ["/dist"]` an absolute path and `no-self-dependency` rejecting the `"file:."` self-link.
- **Hand-written unusual manifests** — mistakes published packages never ship (absolute paths, `EOVERRIDE` conflicts, `workspace:` ranges), so the rules the dependency tree never triggers get exercised alongside the others too. That test asserts each of those rules fires, so a rule going silent fails the suite.

Both check the same four properties: no rule crashes, every fix leaves valid JSON, fixing converges in one round, and every suggestion leaves valid JSON. A rule firing on nearly every real manifest usually means the corpus is normalized rather than that the rule is wrong — npm rewrites `author`, `bugs`, `repository`, and key order in its registry metadata.

- Run targeted tests while developing: `node --test --experimental-test-snapshots test/<rule>.js`. Update snapshots with `npm run fix:snapshots` (or add `--test-update-snapshots`).
- Focus a single case with `test.only(...)` and run with `--test-only`.
- Dogfood before pushing: `npm run run-rules-on-codebase`.
- Run the full suite once at the end: `npm test`.

## Linting

CI runs `npm test`, which lints (`npm run lint` — ESLint, markdownlint, and doc-generator `--check`) before tests. A clean `npx xo` does not mean CI passes.

- `npm run fix` auto-fixes everything fixable (`fix:js`, `fix:markdown`, `fix:eslint-docs`, `fix:snapshots`) — prefer it over hand-fixing.
- Test cases are single-quoted JS strings containing JSON. ESLint enforces single quotes, so don't reach for backtick strings unless you need interpolation.

## Creating a new rule

1. `npm run create-rule` scaffolds the rule, test, and doc files and regenerates the index/doc headers.
2. Write tests in `test/<rule>.js`.
3. Implement `rules/<rule>.js`.
4. Document in `docs/rules/<rule>.md` (below the auto-generated header).
5. `node --test --experimental-test-snapshots test/<rule>.js`, then `npm run lint:js`, `npm run run-rules-on-codebase`, and `npm test`.

## Commit message format

- New rule: `` Add `rule-name` rule ``
- Fix/improve a rule: `` `rule-name`: Short description ``
- Add an option: `` `rule-name`: Add `optionName` option ``
- Drop a rule: `` Drop `rule-name` rule ``
- General fix (not scoped to one rule): `Fix short description`
