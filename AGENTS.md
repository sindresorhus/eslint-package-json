# Agents

## Philosophy

Keep rules simple and high-signal. Target common, real `package.json` mistakes. Skip rare edge cases rather than overcomplicating a rule. Prefer few powerful parameterized rules over many near-identical ones (one `dependency-version-range` with a `dependencyTypes` option, not a `no-caret-*` rule per dependency group).

This plugin lints `package.json` via [`@eslint/json`](https://github.com/eslint/json). Rules visit the JSON AST (momoa), not JavaScript.

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
- `iterateDependencies(root, types?)` — yields `{groupName, group, member, name}` across dependency groups.
- `dependencyTypes` — the four standard dependency group names.
- `removeMember`/`removeElement` — comma-aware removal (generators yielding fixes).
- `buildReorderedObject(sourceCode, object, orderedMembers)` + `isSameOrder` — for sorting fixes that preserve indentation.
- `getIndentString`/`getNewline` — detect the file's formatting.
- `optionsSchema(properties)` + `stringArraySchema` — build a rule's options schema without boilerplate.

Import from `'./utils/index.js'`.

External: `semver`, `validate-npm-package-name`, `spdx-expression-parse`, `detect-indent`.

## Autofix

Provide an autofix only if it cannot change install/runtime behavior. If it could (e.g. changing a version range, reordering `exports` conditions, moving a dependency between groups), provide a `suggest` instead and set `hasSuggestions: true`.

- Build replacement strings with `JSON.stringify(value)` so quoting/escaping is correct.
- Strict JSON has no trailing commas — handle comma tokens manually when adding/removing members or array elements (`removeMember` does this for object members).
- Whole-object reordering fixes must preserve the file's real indentation and newline (read them from the source, or use `getIndentString`/`getNewline`).
- Strict JSON has no comments, so fixes never need to preserve them.

## Rule naming

- `no-` — disallow something (`no-empty-fields`, `no-git-dependencies`).
- `prefer-` — suggest a better alternative (`prefer-provenance`).
- `require-` — mandate presence (`require-fields`).
- `consistent-` — enforce a single style (`consistent-path-prefix`).
- `valid-` — validate a field's structure/value. Objective, option-less field checks live together in `valid-fields`; give a field its own `valid-` rule only when it needs options or encodes an opinion.

Name after the target, not the fix. Use backticks around rule and option names in commit messages.

## Auto-generated files

- `rules/index.js` is generated — never edit by hand. Run `npm run create-rules-index-file` after adding/removing a rule.
- Doc headers in `docs/rules/<rule>.md` (everything above `<!-- end auto-generated rule header -->`) and the `readme.md` rules table are generated by `eslint-doc-generator`. Run `npm run fix:eslint-docs`.

On rebase, `rules/index.js` and the `readme.md` rules table almost always conflict because other rules were added meanwhile. Don't hand-resolve `rules/index.js` — take either side, then run `npm run create-rules-index-file`. For the `readme.md` table, keep both rows and re-sort alphabetically (or just run `npm run fix:eslint-docs`).

## Documentation

Write the prose in `docs/rules/<rule>.md` below the `<!-- end auto-generated rule header -->` line; everything above it is generated.

- Keep the `## Examples` heading. Show failing and passing cases in separate `json` fenced code blocks, each labelled with a `// ❌` or `// ✅` comment on the first line. Pair each fail with its passing counterpart.
- When a rule has options, add a `## Options` section with a `### optionName` subsection per option, each giving `Type:` and `Default:` (use a trailing `\` for the line break), then prose. Lead the relevant examples with the option context (e.g. `With {range: 'caret'} (the default):`).
- Write rule-configuration snippets in JavaScript, not JSON: `'package-json/rule': ['error', {…}]`. Put severity and options on separate lines when the rule has options, and omit trailing commas.
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
