/* eslint-disable unicorn/prefer-https -- The fixtures intentionally contain http:// URLs to exercise the rule. */
import {getTester} from './utils/test.js';

const {test} = getTester(import.meta);

test.snapshot({
	valid: [
		// `name`
		'{"name": "foo"}',
		'{"name": "@scope/foo"}',
		'{"name": "foo-bar.baz"}',
		'{"name": "lodash.merge"}',
		// No `name` field is out of scope for this rule.
		'{"version": "1.0.0"}',
		// `version`
		'{"version": "1.0.0"}',
		'{"version": "1.0.0-beta.1"}',
		'{"version": "0.0.0"}',
		// Build metadata is valid and must be preserved (not flagged).
		'{"version": "1.2.3+build.5"}',
		// Out of scope.
		'{"name": "foo"}',
		// `private`
		'{"private": true}',
		'{"private": false}',
		// Out of scope.
		'{"name": "foo"}',
		// `description`
		'{"description": "A test package."}',
		// Empty string is handled by `no-empty-fields`.
		'{"description": ""}',
		// `license`
		'{"license": "MIT"}',
		// Npm reads a license from `licence` when `license` is missing or empty, so the alias is a field it
		// validates too.
		'{"licence": "MIT"}',
		'{"license": "", "licence": "MIT"}',
		'{"license": "(MIT OR Apache-2.0)"}',
		'{"license": "Apache-2.0"}',
		// SPDX `WITH` exception.
		'{"license": "Apache-2.0 WITH LLVM-exception"}',
		// SPDX `AND` compound.
		'{"license": "(MIT AND ISC)"}',
		'{"license": "UNLICENSED"}',
		'{"license": "SEE LICENSE IN LICENSE.md"}',
		// Npm's publish-time validator accepts either spelling of both markers, so both must pass here.
		'{"license": "UNLICENCED"}',
		'{"license": "SEE LICENCE IN LICENSE.md"}',
		'{"license": "SEE LICENCE IN Licence.md"}',
		// Out of scope.
		'{"name": "foo"}',
		// `repository`
		'{"repository": "sindresorhus/foo"}',
		'{"repository": "github:sindresorhus/foo"}',
		'{"repository": "git@github.com:sindresorhus/foo.git"}',
		'{"repository": "git@git.example.com:foo/bar.git"}',
		'{"repository": "https://github.com/sindresorhus/foo"}',
		'{"repository": "https://example.com"}',
		'{"repository": {"type": "git", "url": "git+https://github.com/sindresorhus/foo.git"}}',
		'{"repository": {"url": "git+https://github.com/sindresorhus/foo.git", "directory": "packages/foo"}}',
		'{"name": "foo"}',
		// `homepage`
		'{"name": "foo"}',
		'{"homepage": "https://example.com"}',
		// A scheme is case-insensitive, so an uppercase one is the same URL npm parses.
		'{"homepage": "HTTPS://example.com"}',
		'{"homepage": "http://example.com/readme"}',
		// `bugs`
		'{"name": "foo"}',
		'{"bugs": "https://github.com/user/repo/issues"}',
		'{"bugs": {"url": "https://github.com/user/repo/issues"}}',
		'{"bugs": {"email": "bugs@example.com"}}',
		'{"bugs": {"url": "https://example.com", "email": "bugs@example.com"}}',
		// `funding`
		'{"name": "foo"}',
		'{"funding": "https://github.com/sponsors/user"}',
		'{"funding": {"url": "https://github.com/sponsors/user"}}',
		'{"funding": {"type": "individual", "url": "https://example.com"}}',
		'{"funding": [{"url": "https://example.com"}, "https://other.com"]}',
		// `author`
		'{"name": "foo"}',
		'{"author": "Sindre Sorhus <sindre@example.com> (https://sindresorhus.com)"}',
		'{"author": {"name": "Sindre Sorhus"}}',
		'{"contributors": ["Alice", {"name": "Bob"}]}',
		// `type`
		'{"name": "foo"}',
		'{"type": "commonjs"}',
		'{"type": "module"}',
		// Legacy fields are intentionally ignored, including malformed values.
		'{"main": false, "module": [], "types": 42, "typings": null}',
		'{"browser": 42}',
		'{"browser": "C:/browser.js"}',
		'{"browser": {"/server.js": [], "./server.js": "/browser.js", "./remote.js": "https://cdn.example.com/browser.js"}}',
		// Empty string is handled by `no-empty-fields`.
		'{"type": ""}',
		// `exports`
		// String exports value.
		'{"exports": "./index.js"}',
		// An empty object has no conditions or subpaths to check.
		'{"exports": {}}',
		// Simple subpath.
		'{"exports": {".": "./index.js"}}',
		// Condition maps are structurally valid regardless of condition ordering.
		'{"exports": {"types": "./index.d.ts", "default": "./index.js"}}',
		'{"exports": {"types": "./index.d.ts", "import": "./index.mjs", "default": "./index.js"}}',
		'{"exports": {"default": "./index.js", "import": "./index.mjs"}}',
		'{"exports": {"import": "./index.mjs", "types": "./index.d.ts", "default": "./index.js"}}',
		'{"exports": {"import": "./index.mjs", "default": "./index.js", "types": "./index.d.ts"}}',
		'{"exports": {"require": "./index.cjs", "module": "./index.mjs", "default": "./index.js"}}',
		// Nested condition map.
		`{
	"exports": {
		"./feature": {
			"types": "./feature.d.ts",
			"import": "./feature.mjs",
			"default": "./feature.js"
		}
	}
}`,
		// No exports field.
		'{"name": "foo"}',
		// Null value (valid as a blocking condition).
		'{"exports": {"default": null}}',
		// Array fallback values with relative paths are valid.
		'{"exports": {".": ["./a.js", "./b.js"]}}',
		// Subpath map (all keys are subpaths).
		'{"exports": {".": "./index.js", "./feature": "./feature.js"}}',
		// Trailing-slash mappings are owned by `no-exports-trailing-slash`.
		'{"exports": {"./feature/": "./feature/"}}',
		'{"exports": {"./feature//": "./feature/"}}',
		// Nested condition maps exercise recursive target validation.
		'{"exports": {"import": {"types": "./index.d.mts", "default": "./index.mjs"}, "require": {"types": "./index.d.cts", "default": "./index.cjs"}}}',
		'{"exports": {".": {"import": {"types": "./index.d.mts", "default": "./index.mjs"}, "require": {"types": "./index.d.cts", "default": "./index.cjs"}}}}',
		// Symmetric subpath patterns.
		'{"exports": {"./feature/*": "./dist/feature/*.js"}}',
		'{"exports": {"./feature/*": {"types": "./dist/feature/*.d.ts", "default": "./dist/feature/*.js"}}}',
		// Subpath patterns can also resolve to one fixed target.
		'{"exports": {"./feature/*": "./dist/index.js"}}',
		'{"exports": {"./feature/*": {"types": "./dist/feature.d.ts", "default": "./dist/feature/*.js"}}}',
		// `imports`
		'{"name": "foo"}',
		'{"imports": {"#dep": "./src/dep.js"}}',
		'{"imports": {"#dep": null}}',
		'{"imports": {"#internal/*.js": "./src/internal/*.js"}}',
		'{"imports": {"#/internal": "./src/internal.js"}}',
		'{"imports": {"#external": "foo/../bar"}}',
		'{"imports": {"#nested": "foo/node_modules/bar"}}',
		// Node matches `exports` and `imports` keys literally and only validates the target, so a `.`,
		// `..`, or `node_modules` segment in a key resolves. It is the target those segments break in.
		'{"exports": {"./utils/./helper.js": "./utils/helper.js"}}',
		'{"exports": {"./a/../b": "./b.js"}}',
		'{"exports": {"./a/node_modules/b": "./b.js"}}',
		'{"exports": {"./a/%2e%2e/b": "./b.js"}}',
		'{"imports": {"#dep/../other": "./dep.js"}}',
		'{"imports": {"#dep/./other": "./dep.js"}}',
		'{"imports": {"#dep//other": "./dep.js"}}',
		'{"imports": {"#dep/node_modules/x": "./dep.js"}}',
		'{"imports": {"#colon": "foo/bar:baz"}}',
		'{"imports": {"#percent": "foo/%25"}}',
		'{"imports": {"#scope": "@scope/package/subpath"}}',
		'{"imports": {"#fs": "fs", "#path": "path", "#legacy": "Foo"}}',
		// `default` and `types` ordering is owned by the dedicated condition rules.
		'{"imports": {"#dep": {"default": "./dep.js", "import": "./dep.mjs", "types": "./dep.d.ts"}}}',
		'{"imports": {"#dep": {"require": "./dep.cjs", "module": "./dep.mjs", "default": "./dep.js"}}}',
		// An array fallback of plain targets.
		'{"imports": {"#dep": ["./a.js", "./b.js"]}}',
		// `bin`
		'{"name": "foo"}',
		'{"bin": "./cli.js"}',
		'{"bin": {"foo": "./cli.js"}}',
		'{"bin": {"foo": "./foo.js", "bar": "./bar.js"}}',
		// Empty string is handled by `no-empty-fields`.
		'{"bin": ""}',
		// `directories.bin` alone is fine.
		'{"directories": {"bin": "./bin"}}',
		// `man`
		'{"name": "foo"}',
		'{"man": "./man/foo.1"}',
		'{"man": "./man/foo.10"}',
		'{"man": ["./man/foo.1", "./man/bar.8.gz"]}',
		// `sideEffects`
		'{"name": "foo"}',
		'{"sideEffects": false}',
		'{"sideEffects": true}',
		'{"sideEffects": ["./src/polyfill.js", "*.css"]}',
		'{"sideEffects": []}',
		// `engines`
		'{"engines": {"node": ">=18"}}',
		'{"engines": {"node": "^18.0.0 || ^20.0.0"}}',
		'{"engines": {"node": ">=18", "npm": ">=9"}}',
		'{"engines": {"node": "*"}}',
		'{"engines": {"vscode": "^1.80.0"}}',
		// Out of scope.
		'{"name": "foo"}',
		'{"engines": {}}',
		// `devEngines`
		'{"name": "foo"}',
		// Object notation.
		'{"devEngines": {"runtime": {"name": "node", "version": ">=20"}}}',
		// Array notation.
		'{"devEngines": {"packageManager": [{"name": "npm"}, {"name": "pnpm", "version": ">=9"}]}}',
		// All recognized keys and a non-node runtime.
		'{"devEngines": {"runtime": {"name": "bun"}, "cpu": {"name": "x64"}, "os": {"name": "linux"}, "libc": {"name": "glibc"}}}',
		// `download` is a valid `onFail`.
		'{"devEngines": {"packageManager": {"name": "pnpm", "version": ">=11", "onFail": "download"}}}',
		'{"devEngines": {"runtime": {"name": "node", "onFail": "warn"}}}',
		// Npm reads the range with `semver.satisfies`, which reads an empty one as `*`, so an empty version
		// installs exactly as a missing one would. The same is already true of `engines`.
		'{"devEngines": {"runtime": {"name": "node", "version": ""}}}',
		'{"engines": {"node": ""}}',
		'{"engines": {"npm": "", "node": ">=18"}}',
		// Npm skips a falsy `engines` value, so it restricts nothing.
		'{"engines": {"node": null}}',
		'{"engines": {"node": false}}',
		'{"engines": {"node": 0}}',
		// `os`
		'{"name": "foo"}',
		'{"os": ["darwin", "linux"]}',
		'{"os": ["!win32"]}',
		'{"os": ["darwin", "!win32"]}',
		// `cpu`
		'{"name": "foo"}',
		'{"cpu": ["x64", "arm64"]}',
		'{"cpu": ["!arm64"]}',
		'{"cpu": ["x64", "!ia32"]}',
		'{"cpu": ["ppc64"]}',
		'{"cpu": ["!ppc64"]}',
		// `publishConfig`
		'{"name": "foo"}',
		'{"publishConfig": {"access": "public"}}',
		'{"publishConfig": {"access": "restricted"}}',
		'{"publishConfig": {"provenance": true}}',
		'{"publishConfig": {"registry": "https://npm.pkg.github.com"}}',
		'{"publishConfig": {"tag": "next"}}',
		'{"publishConfig": {"tag": "next", "registry": "https://npm.example.com"}}',
		// `access` is meaningful for a scoped package.
		'{"name": "@scope/foo", "publishConfig": {"access": "public"}}',
		// `packageManager`
		'{"name": "foo"}',
		'{"packageManager": "pnpm@9.1.0"}',
		'{"packageManager": "yarn@3.2.3+sha224.953c8233f7a92884eee2de69a1b92d1f2ec1655e66d08071ba9a02fa"}',
		'{"packageManager": "npm@10.8.2"}',
		'{"packageManager": "bun@1.0.0"}',
		'{"packageManager": "pnpm@9.1.0-beta.1+sha512.abc"}',

		// `scripts`
		'{"name": "foo"}',
		'{"scripts": {"build": "tsc", "test": "node --test"}}',
		'{"scripts": {}}',
		// `files`
		'{"name": "foo"}',
		'{"files": ["dist", "index.js"]}',
		'{"files": ["src/**/*.js"]}',
		// Npm's default ignores are overridden by an explicit `files` entry, unlike the forced ones.
		'{"files": [".hg", ".svn", "CVS", "*.orig"]}',
		// `workspaces`
		'{"name": "foo"}',
		'{"workspaces": ["packages/*"]}',
		'{"workspaces": ["packages/*", "apps/*"]}',
		// Yarn classic object form.
		'{"workspaces": {"packages": ["packages/*"]}}',
		// `keywords`
		'{"name": "foo"}',
		'{"keywords": ["eslint", "json", "package"]}',
		// Internal whitespace in a multi-word keyword is allowed.
		'{"keywords": ["state management"]}',
		// Keyword differs from the package name.
		'{"name": "foo", "keywords": ["bar"]}',
		// Empty array is handled by `no-empty-fields`.
		'{"keywords": []}',
		// `dependencies`
		'{"name": "foo"}',
		'{"dependencies": {"foo": "^1.0.0"}}',
		'{"devDependencies": {"foo": "^1.0.0"}}',
		'{"optionalDependencies": {"foo": "^1.0.0"}}',
		'{"peerDependencies": {"foo": ">=1"}}',
		// Non-semver but still string specifiers are accepted (range validity is not checked).
		'{"dependencies": {"foo": "github:user/repo", "bar": "workspace:*"}}',
		'{"dependencies": {}}',
		// `peerDependenciesMeta`
		'{"peerDependencies": {"a": "1.0.0"}, "peerDependenciesMeta": {"a": {"optional": true}}}',
		'{"peerDependencies": {"a": "1.0.0"}, "peerDependenciesMeta": {"a": {}}}',
		// Non-boolean metadata values are outside this rule's redundancy check.
		'{"peerDependencies": {"a": "1.0.0"}, "peerDependenciesMeta": {"a": {"optional": "false"}}}',
		// Non-object metadata entries are outside this rule's redundancy check.
		'{"peerDependencies": {"a": "1.0.0"}, "peerDependenciesMeta": {"a": false}}',
		'{"name": "foo"}',
		'{"peerDependenciesMeta": {}}',
		// `bundleDependencies`
		'{"name": "foo"}',
		'{"dependencies": {"foo": "^1.0.0"}, "bundledDependencies": ["foo"]}',
		'{"dependencies": {"foo": "^1.0.0"}, "bundleDependencies": ["foo"]}',
		'{"optionalDependencies": {"foo": "^1.0.0"}, "bundledDependencies": ["foo"]}',
		'{"bundledDependencies": []}',
		// Boolean values mean bundle all or none.
		'{"bundleDependencies": true}',
		'{"bundledDependencies": true}',
		'{"bundleDependencies": false}',
		'{"bundledDependencies": false}',
		// Npm deletes `bundledDependencies` when `bundleDependencies` is present, so only the kept spelling is checked.
		'{"dependencies": {"foo": "1"}, "bundleDependencies": ["foo"], "bundledDependencies": ["bar"]}',
		// Npm reads an object as the list of its keys.
		'{"dependencies": {"foo": "1"}, "bundleDependencies": {"foo": true}}',
		// `overrides`
		'{"name": "foo"}',
		'{"overrides": {"foo": "1.0.0"}}',
		// Nested override.
		'{"overrides": {"foo": {"bar": "1.0.0"}}}',
		// Mirror form and self-key are plain strings.
		'{"overrides": {"foo": "$foo", "bar": {".": "1.0.0"}}}',
		'{"overrides": {"lodash": {".": null}}}',
		'{"overrides": {"lodash": {".": ""}}}',
		'{"overrides": {".": {"x": "1.0.0"}}}',
		'{"overrides": {"foo": "$foo"}}',
		'{"overrides": {"foo@^1.0.0": "1.0.0"}}',
		// The message is about the version npm reads, and a shadowed duplicate is not one it ever sees.
		'{"dependencies": {"foo": 1, "foo": "^1.0.0"}}',
		// Npm deletes a truthy non-string but leaves a `null` in place and reads it as "no description",
		// which is the value npm itself writes when there is none.
		'{"description": null}',
		// A filename after the marker may contain spaces, so only an empty remainder is rejected.
		'{"license": "SEE LICENSE IN  a b"}',
		// Npm flattens a `bin` array into an object keyed by each entry's basename, so the array form is
		// a supported legacy shape rather than a field type error.
		'{"bin": ["./cli.js"]}',
		'{"bin": ["a/b.js", "c/d.js"]}',
		'{"bin": []}',
		// Node resolves an empty path segment, only warning about it with DEP0166, so `./a//b.js` is a
		// working target and must not be reported as a segment Node does not allow.
		'{"exports": {".": "./a//b.js"}}',
		'{"exports": {".": ".//a.js"}}',
		'{"imports": {"#a": "./a//b.js"}}',

		// The shapes npm keeps, including a `bugs` url that holds an `@` before a later `.`, which the object
		// form parses as a URL even though the string form would read it as an email.
		'{"bugs": {"url": "https://user@github.com/u/r"}}',
		'{"bugs": {"url": "https://x.com/issues", "email": "a@b.com"}}',
		// Npm guards each property with the truthiness of its value, so an empty `url` is never examined as a
		// url. The `email` beside it is kept, so the field survives and nothing is wrong with the shape.
		'{"bugs": {"url": "", "email": "a@b.com"}}',
		'{"bugs": {"url": null, "email": "a@b.com"}}',
		'{"bugs": {"url": 0, "email": "a@b.com"}}',
		'{"bugs": {"url": false, "email": "a@b.com"}}',
		'{"bugs": "a@b.com"}',
		'{"bugs": "https://x.com"}',
		'{"readme": null}',
		'{"readme": "# Title"}',
		'{"maintainers": [{"name": "A"}]}',
		'{"maintainers": []}',
		// A nested `node_modules` or lockfile is publishable, so unlike the root forms these are not ignored.
		'{"files": ["a/node_modules/x"]}',
		'{"files": ["a/package-lock.json"]}',
		'{"files": ["x/.npmrc.txt"]}',
		// `any` is npm's own idiom for "no restriction" when it is the whole list, which its `checkList` short-circuits on.
		'{"os": ["any"]}',
		'{"os": "any"}',
		'{"cpu": ["any"]}',
		// Npm wraps a bare string into a one-element list before checking it, so the string shorthand is a
		// form it supports.
		'{"cpu": "arm64"}',
		// `npm fund` reads a plain `http:` URL too, and a URL that only needs a port to resolve is still a URL.
		'{"funding": "http://example.com/donate"}',
		'{"funding": "https://example.com:8443/donate"}',
		// A subpath key repeated with a different value resolves to the last one, so the shadowed target is not
		// one npm ever resolves.
		'{"exports": {"./a": "./a/*.js", "./a": "./a.js"}}',
		'{"exports": {"./a": {"./a/*.js": "./x.js", "./a": "./a.js"}}}',
		// The string shorthand of `bugs` is the one form that takes either shape.
		'{"bugs": "bugs@example.com"}',
		// An unknown key beside a `url` is dropped without taking the field with it.
		'{"bugs": {"url": "https://example.com/issues", "note": "x"}}',
		// An `imports` key repeated with a different value resolves to the last one, so the shadowed target is
		// not one Node ever resolves.
		'{"imports": {"#dep": 123, "#dep": "./dep.js"}}',
		'{"imports": {"#dep": {"node": 123, "node": "./dep.js"}}}',
		// An `engines` key repeated with a different value resolves to the last one, so the shadowed range is
		// not one npm ever checks.
		'{"engines": {"node": 18, "node": ">=18"}}',
		// A `scripts` key repeated with a different value resolves to the last one, so the shadowed value is not
		// one npm ever runs.
		'{"scripts": {"build": 1, "build": "tsc"}}',
		// A `bin` key repeated with a different value resolves to the last one, so the shadowed path is not one
		// npm ever installs.
		'{"bin": {"foo": true, "foo": "./cli.js"}}',
		// An `overrides` key repeated with a different value resolves to the last one, so the shadowed override
		// is not one npm ever applies.
		'{"overrides": {"foo": 1, "foo": "1.0.0"}}',
		'{"overrides": {"foo": {"bar": 1, "bar": "1.0.0"}}}',
		// Node raises the "cannot mix" error from the top-level `exports` object only. A nested object is walked
		// for `default` or a matching condition, so a key starting with `.` beside one that does not is a
		// condition no consumer asks for and the target beside it still resolves.
		'{"exports": {"./a": {"import": "./a.js", "./b": "./b.js"}}}',
		// Npm guards the `directories.bin` expansion on `!data.bin`, so a falsy `bin` is what lets it be read
		// and the two fields are not in conflict.
		'{"bin": "", "directories": {"bin": "./bin"}}',
		// Npm's own test is `/^SEE LICEN[CS]E IN ./`, so any one character after the space is the filename it
		// never reads.
		'{"license": "SEE LICENSE IN   "}',
		'{"license": "SEE LICENSE IN  MIT"}',
		'{"exports": {".": "./a.js", "./b": {"import": "./a.js", "./b": "./b.js"}}}',
		// Values published by the `@esbuild/*` and `@rollup/rollup-*` platform packages.
		'{"os": ["netbsd"], "cpu": ["x64"]}',
		'{"os": ["openharmony"], "cpu": ["arm64"]}',
		'{"os": ["linux"], "cpu": ["mips64el"]}',
		'{"os": ["cygwin", "haiku"]}',
		// Only the entry npm reads counts, and here it is an optional peer. The shadowed duplicate is not orphaned on its own.
		'{"peerDependencies": {"b": "1"}, "peerDependenciesMeta": {"a": {"optional": false}, "a": {"optional": true}, "b": {"optional": true}}}',
		// The napi-rs WebAssembly packages (`@tailwindcss/oxide-wasm32-wasi`, `@unrs/resolver-binding-wasm32-wasi`) publish this.
		'{"cpu": ["wasm32"]}',
		// A negated `!any` excludes a platform nothing is named, so it restricts nothing.
		'{"os": ["!any"]}',
		'{"cpu": ["x64", "!any"]}',
		// A trailing-slash folder mapping is `no-exports-trailing-slash`' report.
		'{"imports": {"#dep/": "./dep/"}}',
		'{"imports": {"#dep//": "./dep/"}}',
		// An empty `bugs` string or object is left to `no-empty-fields`.
		'{"bugs": ""}',
		'{"bugs": {}}',
		// `libnpmpublish` throws `EUSAGE` for `provenance: true` on a first publish unless `access` is `public`, so it is not redundant on an unscoped package.
		'{"name": "foo", "publishConfig": {"access": "public", "provenance": true}}',
		'{"name": "foo", "publishConfig": {"access": "public"}}',
		// Npm resolves an optional peer declared only in `peerDependenciesMeta` from the tree and links it, so the entry is not orphaned (`debug` declares `supports-color` this way).
		'{"peerDependenciesMeta": {"supports-color": {"optional": true}}}',
		'{"peerDependencies": {"a": "1.0.0"}, "peerDependenciesMeta": {"a": {"optional": true}, "b": {"optional": true}}}',
		// A top-level field that is empty is `no-empty-fields`' report, whatever else is wrong with its type, so it is not repeated here.
		'{"name": ""}',
		'{"version": ""}',
		'{"license": ""}',
		'{"repository": []}',
		'{"homepage": ""}',
		'{"sideEffects": {}}',
		'{"scripts": []}',
		'{"name": {}}',
		'{"name": []}',
		'{"version": {}}',
		'{"version": []}',
		'{"readme": {}}',
		'{"workspaces": {}}',
		'{"funding": ""}',
		'{"licence": ""}',
		'{"exports": ""}',
		'{"man": ""}',
		'{"os": []}',
		'{"cpu": ""}',
		'{"packageManager": ""}',
		'{"repository": {}}',
		'{"funding": {}}',
		'{"author": {}}',
		'{"keywords": {}}',
		'{"license": "MITT", "license": ""}',
		// Create React App reads a path-shaped `homepage` as where the app is served from, and no scheme the rule could add turns it into a working URL.
		'{"homepage": "."}',
		'{"homepage": "./"}',
		'{"homepage": "/myapp"}',
	],
	invalid: [
		// A recognized protocol is required, not merely a hostname.
		'{"repository": "ftp://example.com/repo"}',
		// An absolute path is not a valid `imports` target.
		'{"imports": {"#a": "/abs.js"}}',
		// `name`
		'{"name": "Foo"}',
		'{"name": " foo"}',
		'{"name": ".foo"}',
		'{"name": "foo bar"}',
		'{"name": "node_modules"}',
		'{"name": "@scope/"}',
		'{"name": "excited!"}',
		// `version`
		'{"version": "1.0"}',
		'{"version": "^1.0.0"}',
		'{"version": "latest"}',
		'{"version": "v1.0.0.0"}',
		// `semver.clean` is case-sensitive, so an uppercase `V` is not a prefix npm strips. It cleans to `null`
		// and the publish is refused, which is not the same claim as "not canonical".
		'{"version": "V1.0.0"}',
		'{"version": "Vv1.0.0"}',
		// A `v` prefix (e.g. copied from a git tag) is not canonical.
		'{"version": "v1.0.0"}',
		// Surrounding whitespace is not canonical.
		'{"version": " 1.0.0 "}',
		// The `v` prefix fix must preserve build metadata.
		'{"version": "v1.2.3+build.5"}',
		// `private`
		// A string is truthy but is not treated as `private` by npm.
		'{"private": "true"}',
		'{"private": "false"}',
		'{"private": 1}',
		// `description`
		'{"description": 42}',
		'{"description": ["a", "b"]}',
		// `license`
		'{"license": "MITT"}',
		'{"license": "Foo Bar"}',
		// `SEE LICENSE IN` without a filename.
		'{"license": "SEE LICENSE IN "}',
		'{"license": {"type": "MIT", "url": "https://example.com"}}',
		'{"license": {"url": "https://example.com"}}',
		// Non-string, non-object values.
		'{"license": 42}',
		'{"license": null}',
		// `repository`
		'{"repository": {"type": "git"}}',
		'{"repository": {"url": 123}}',
		'{"repository": {"url": "git+https://github.com/sindresorhus/foo.git", "type": 1}}',
		'{"repository": {"url": "git+https://github.com/sindresorhus/foo.git", "directory": false}}',
		'{"repository": "not a url"}',
		'{"repository": {"url": "http//bad"}}',
		'{"repository": "mailto:owner@example.com"}',
		// Neither a string nor an object.
		'{"repository": 123}',
		'{"repository": null}',
		// `homepage`
		'{"homepage": "git@github.com:user/repo.git"}',
		// Npm publishes a bare host as `http://…`, so the report says which scheme the manifest ends up with
		// rather than calling the value invalid, and the suggestion writes the one the author wants.
		'{"homepage": "example.com"}',
		'{"homepage": "www.example.com/x"}',
		// A protocol-relative URL is not a bare host: npm's own rewrite makes `http:////example.com`.
		'{"homepage": "//example.com"}',
		// A value that has a scheme npm does not rewrite is not a bare host either, so it keeps the plain report
		// rather than the one that claims npm rewrites it.
		'{"homepage": "ftp://example.com/x"}',
		// A scheme is case-insensitive and may hold a `+`, so npm parses these as they stand rather than
		// prefixing an `http://` that makes nonsense of them.
		'{"homepage": "FTP://example.com"}',
		'{"homepage": "git+ssh://git@example.com/repo.git"}',
		'{"homepage": "mailto:a@b.com"}',
		'{"homepage": "not a url"}',
		'{"homepage": 42}',
		// `bugs`
		'{"bugs": 123}',
		'{"bugs": ["https://example.com"]}',
		'{"bugs": {"url": 1}}',
		'{"bugs": {"email": false}}',
		// A falsy `url` is stepped over rather than examined, so the object holds nothing npm keeps and the
		// field is what goes, not the property.
		'{"bugs": {"url": ""}}',
		'{"bugs": {"url": null}}',
		'{"bugs": {"url": "", "note": "x"}}',
		// `funding`
		'{"funding": 123}',
		'{"funding": {"type": "individual"}}',
		'{"funding": {"url": 42}}',
		'{"funding": [{"type": "patreon"}]}',
		'{"funding": [1]}',
		// `author`
		'{"author": {"email": "sindre@example.com"}}',
		// `name` present but not a string; the error points at the value.
		'{"author": {"name": 42}}',
		'{"author": 42}',
		'{"author": null}',
		'{"contributors": {"name": "Bob"}}',
		'{"contributors": [{"email": "bob@example.com"}]}',
		'{"contributors": [42]}',
		// `type`
		'{"type": "esm"}',
		'{"type": "module "}',
		'{"type": "Module"}',
		'{"type": true}',
		'{"type": 42}',
		// `exports`
		// Non-relative path (missing `./`).
		'{"exports": {"default": "index.js"}}',
		// A `../` path is flagged but not autofixed (prepending `./` would not make it valid).
		'{"exports": {"default": "../index.js"}}',
		'{"exports": "."}',
		'{"exports": ".."}',
		'{"exports": "node_modules/index.js"}',
		'{"exports": "%2e%2e/index.js"}',
		'{"exports": "node:fs"}',
		'{"exports": "C:/index.js"}',
		// Non-relative path in nested subpath.
		`{
	"exports": {
		"./feature": {
			"default": "feature/index.js"
		}
	}
	}`,
		// Invalid target values are not package targets.
		'{"exports": "/abs/index.js"}',
		'{"exports": "/../index.js"}',
		'{"exports": {"default": 123}}',
		'{"exports": {"default": true}}',
		'{"exports": {"default": "./dist/../index.js"}}',
		'{"exports": {"default": "./dist/%2e%2e/index.js"}}',
		'{"exports": {"default": "./node_modules/foo.js"}}',
		'{"exports": {"0": "./index.js"}}',
		'{"exports": null}',
		'{"exports": false}',
		'{"exports": 1}',
		// String exports without ./
		'{"exports": "index.js"}',
		// Non-relative path inside an array fallback.
		'{"exports": {".": ["a.js", "./b.js"]}}',
		// Mixing a subpath key and a condition key.
		'{"exports": {".": "./index.js", "import": "./index.mjs"}}',
		// Subpath key that does not start with `./`.
		'{"exports": {".foo": "./foo.js"}}',
		// Subpath pattern target without a pattern key inside conditions.
		'{"exports": {"./feature": {"default": "./dist/*.js"}}}',
		// Subpath pattern target without a pattern key.
		'{"exports": {"./feature": "./dist/*.js"}}',
		// Subpath pattern target without a pattern key inside mixed conditions.
		'{"exports": {"./feature": {"types": "./dist/feature.d.ts", "default": "./dist/feature/*.js"}}}',
		// Root export pattern target without a pattern key.
		'{"exports": "./dist/*.js"}',
		'{"exports": {"default": "./dist/*.js"}}',
		// `imports`
		'{"imports": {"dep": "./src/dep.js"}}',
		'{"imports": {"#dep": "./a.js", "dep": "./b.js"}}',
		'{"imports": ["#dep"]}',
		'{"imports": {"#dep": 123}}',
		'{"imports": {"#dep": "../dep.js"}}',
		// A `#` key nested in a conditions object is not a condition, so Node never matches it.
		'{"imports": {"#a": {"#b": "./a.js"}}}',
		'{"imports": {"#a": {"node": {"#b": "./a.js"}}}}',
		'{"imports": {"#a": {"#b": "./a.js", "default": "./b.js"}}}',
		'{"imports": {"#a": [{"#b": "./a.js"}]}}',
		'{"imports": {"#dep": "./dep/../index.js"}}',
		'{"imports": {"#dep": "./dist/%2e%2e/index.js"}}',
		// A bare `#` is the one key shape Node rejects outright.
		'{"imports": {"#": "./dep.js"}}',
		'{"imports": {"#dep": "https://example.com/dep.js"}}',
		'{"imports": {"#dep": "."}}',
		'{"imports": {"#dep": "node:"}}',
		'{"imports": {"#fs": "node:fs"}}',
		'{"imports": {"#scope": "@scope"}}',
		'{"imports": {"#percent": "foo/%"}}',
		'{"imports": {"#percent": "foo/%zz"}}',
		'{"imports": {"#percent": "foo/%2"}}',
		'{"imports": {"#dep": {"0": "./dep.js"}}}',
		// `bin`
		'{"bin": true}',
		'{"bin": null}',
		'{"bin": {"foo": true}}',
		'{"bin": {"foo": "./foo.js", "bar": ""}}',
		'{"bin": "./cli.js", "directories": {"bin": "./bin"}}',
		// `man`
		'{"man": "./doc/foo"}',
		'{"man": ["./doc/foo.1", "./doc/bar"]}',
		'{"man": 42}',
		'{"man": [42]}',
		'{"man": "./foo.1.br"}',
		// `sideEffects`
		'{"sideEffects": "false"}',
		'{"sideEffects": "true"}',
		'{"sideEffects": "./src/polyfill.js"}',
		'{"sideEffects": 0}',
		'{"sideEffects": ["./src/polyfill.js", 1]}',
		'{"sideEffects": ["./src/polyfill.js", null]}',
		// `engines`
		'{"engines": {"node": ">=foo"}}',
		'{"engines": {"node": "not a range"}}',
		'{"engines": {"node": ">=18", "npm": "garbage"}}',
		'{"engines": {"node": ">= 18 || garbage"}}',
		// The field itself must be an object.
		'{"engines": ">=18"}',
		'{"engines": ["node"]}',
		'{"engines": null}',
		// `devEngines`
		// Wrong top-level type.
		'{"devEngines": ["node"]}',
		'{"devEngines": "node"}',
		// Wrong field type.
		'{"devEngines": {"runtime": "node"}}',
		// Array element that is not an object.
		'{"devEngines": {"runtime": ["node"]}}',
		// A valid object mixed with a non-object element in the array.
		'{"devEngines": {"packageManager": [{"name": "npm"}, "pnpm"]}}',
		// Missing name.
		'{"devEngines": {"runtime": {"version": ">=20"}}}',
		// Non-string name.
		'{"devEngines": {"runtime": {"name": 1}}}',
		// Non-string version.
		'{"devEngines": {"runtime": {"name": "node", "version": 20}}}',
		// Invalid version range.
		'{"devEngines": {"runtime": {"name": "node", "version": "not-a-range"}}}',
		// Invalid onFail.
		'{"devEngines": {"runtime": {"name": "node", "onFail": "explode"}}}',
		// `os`
		'{"os": ["macos"]}',
		'{"os": ["windows"]}',
		'{"os": ["darwin", "osx"]}',
		// Non-string element.
		'{"os": [42]}',
		// `cpu`
		// Node folds 32-bit PowerPC into `ppc64`, so `process.arch` is never `ppc`.
		'{"cpu": ["ppc"]}',
		'{"cpu": ["amd64"]}',
		'{"cpu": ["x86_64"]}',
		'{"cpu": ["aarch64"]}',
		// Non-string element.
		'{"cpu": [42]}',
		// `publishConfig`
		'{"publishConfig": "public"}',
		'{"publishConfig": {"access": "private"}}',
		'{"publishConfig": {"access": true}}',
		'{"publishConfig": {"provenance": "true"}}',
		// `libnpmpublish` throws `EUNSCOPED` for a restricted unscoped package.
		'{"name": "foo", "publishConfig": {"access": "restricted"}}',
		'{"publishConfig": {"tag": ""}}',
		'{"publishConfig": {"tag": 42}}',
		'{"publishConfig": {"registry": "npm.example.com"}}',
		'{"publishConfig": {"registry": true}}',
		// `packageManager`
		'{"packageManager": "pnpm"}',
		'{"packageManager": "pnpm@latest"}',
		'{"packageManager": "yarn@^3"}',
		'{"packageManager": "pnpm@8"}',
		// An unrecognized package manager name.
		'{"packageManager": "deno@1.0.0"}',
		// `scripts`
		'{"scripts": "build"}',
		'{"scripts": {"build": 1}}',
		'{"scripts": {"build": "tsc", "test": false}}',
		// `files`
		'{"files": "dist"}',
		'{"files": ["node_modules"]}',
		'{"files": ["node_modules/foo"]}',
		'{"files": ["yarn.lock"]}',
		'{"files": ["pnpm-lock.yaml"]}',
		'{"files": ["bun.lockb"]}',
		// Npm strips a leading `./` or `/` from an entry, so both name the same ignored file.
		'{"files": ["/package-lock.json"]}',
		'{"files": ["/yarn.lock"]}',
		'{"files": ["./node_modules"]}',
		'{"files": ["node_modules/a/b/c.js"]}',
		'{"files": ["./.npmrc"]}',
		'{"files": ["dist", ".git"]}',
		'{"files": [1]}',
		'{"files": ["dist", ""]}',
		// `workspaces`
		'{"workspaces": "packages/*"}',
		'{"workspaces": ["packages/*", 1]}',
		'{"workspaces": null}',
		// `keywords`
		'{"keywords": {"0": "eslint"}}',
		'{"keywords": true}',
		'{"keywords": ["eslint", 1]}',
		'{"keywords": ["eslint", ""]}',
		// Removing the last keyword takes the field with it, since an empty `keywords` is what
		// `no-empty-fields` reports. Removing one of several leaves the field.
		'{"keywords": [""]}',
		'{"keywords": ["", "b"]}',
		'{"keywords": ["eslint", "  "]}',
		'{"keywords": ["eslint, json, package"]}',
		'{"keywords": ["eslint", " json"]}',
		'{"keywords": ["react ", "vue"]}',
		'{"name": "ky", "keywords": ["ky", "http"]}',
		// A miscased copy of the package name is reported as redundant (remove), not as a lowercase fix.
		'{"name": "ky", "keywords": ["Ky"]}',
		'{"keywords": ["React"]}',
		'{"keywords": ["eslint", "JSON"]}',
		'{"keywords": ["eslint", "json", "eslint"]}',
		// `dependencies`
		// Group is not an object.
		'{"dependencies": ["foo"]}',
		'{"dependencies": "foo"}',
		'{"devDependencies": 1}',
		// Specifier is not a string.
		'{"dependencies": {"foo": 123}}',
		'{"dependencies": {"foo": null}}',
		'{"dependencies": {"foo": {"version": "1.0.0"}}}',
		'{"peerDependencies": {"foo": true}}',
		// `peerDependenciesMeta`
		// The redundant value is still reported alongside the orphaned entry.
		'{"peerDependenciesMeta": {"a": {"optional": false}}}',
		'{"peerDependencies": {"a": "1.0.0"}, "peerDependenciesMeta": {"a": {"optional": false}}}',
		`{
	"peerDependencies": {
		"a": "1.0.0"
	},
	"peerDependenciesMeta": {
		"a": {
			"before": true,
			"optional": false,
			"after": true
		}
	}
}`,
		`{
	"peerDependencies": {
		"a": "1.0.0"
	},
	"peerDependenciesMeta": {
		"a": {
			"before": true,
			"optional": false
		}
	}
}`,
		// `bundleDependencies`
		'{"bundleDependencies": "foo"}',
		'{"bundledDependencies": "foo"}',
		'{"bundledDependencies": [1]}',
		'{"bundledDependencies": ["foo"]}',
		'{"dependencies": {"foo": "^1.0.0"}, "bundledDependencies": ["foo", "bar"]}',
		// A peer dependency is not published, so it does not satisfy the bundle requirement.
		'{"peerDependencies": {"foo": ">=1"}, "bundledDependencies": ["foo"]}',
		// `overrides`
		// Wrong top-level type.
		'{"overrides": ["foo"]}',
		'{"overrides": "1.0.0"}',
		'{"overrides": null}',
		// Non-string, non-object leaf.
		'{"overrides": {"foo": 1}}',
		'{"overrides": {"foo": true}}',
		'{"overrides": {"foo": null}}',
		// Invalid leaf inside a nested override.
		'{"overrides": {"foo": {"bar": 1}}}',
		// `publishConfig.tag` must not be a valid SemVer range.
		'{"publishConfig": {"tag": "1.0.0"}}',
		'{"publishConfig": {"tag": "v1.4"}}',
		// A shadowed duplicate must go too. Removing only the effective `optional` would promote the earlier `true`, flipping the peer dependency to optional.
		'{"peerDependencies": {"a": "^1.0.0"}, "peerDependenciesMeta": {"a": {"optional": true, "optional": false}}}',
		'{"name": "foo", "publishConfig": {"access": "public", "access": "restricted"}}',
		// `npm publish` throws `name field must be a string`, so a non-string name cannot be published at all.
		'{"name": 42}',
		'{"name": null}',
		// A lone surrogate is a legal JSON string escape but cannot be percent-encoded, so the name validator throws on it. The rule must report, not crash.
		String.raw`{"name": "\ud800"}`,
		String.raw`{"name": "@scope/\udc00"}`,
		// `npm publish` throws `Invalid version` on a non-string `version`, so the manifest cannot be
		// published at all. A `null` is coerced to `""`, which is just as unpublishable.
		'{"version": 1}',
		'{"version": null}',
		'{"version": true}',
		// A surrogate PAIR is well-formed and reaches the validator, which reports it as an invalid name rather than crashing.
		'{"name": "\u{1F600}"}',
		// Npm hands a truthy `engines` value to `semver.satisfies`, which reads anything that is not a string range as a range nothing satisfies, so an install fails with EBADENGINE under `--engine-strict`.
		'{"engines": {"node": 18}}',
		'{"engines": {"npm": 9}}',
		'{"engines": {"node": true}}',
		'{"engines": {"npm": true}}',
		'{"engines": {"npm": ["\u{3E}=9"]}}',
		'{"engines": {"node": {}}}',
		// A custom license reference is valid SPDX grammar, but npm rejects the whole expression for one,
		// including inside a compound one, so it is reported separately from an invalid expression.
		'{"license": "LicenseRef-MIT"}',
		'{"license": "LicenseRef-Proprietary"}',
		'{"license": "(MIT OR LicenseRef-Proprietary)"}',
		'{"license": "MIT AND LicenseRef-x"}',
		'{"license": "DocumentRef-x:LicenseRef-y"}',
		// Every entry still has to be a non-empty path, because npm takes each entry's basename.
		'{"bin": ["cli.js", 42]}',
		'{"bin": ["cli.js", ""]}',
		// Npm deletes a `bugs` url or email that is neither a URL nor an email, then the whole object once
		// it is empty, without telling the author. Verified against `PackageJson.fix()` + `prepare()`.
		'{"bugs": {"url": "not a url"}}',
		'{"bugs": {"email": "not an email"}}',
		'{"bugs": "not a url"}',
		// Npm calls `.trim()` on `readme` to derive the description, so a non-string throws
		// `description.trim is not a function` and the package cannot be published. A `null` is skipped.
		'{"readme": 42}',
		'{"readme": ["# x"]}',
		'{"readme": true}',
		// Npm reads a `null` entry in a person list as a person, so it throws
		// `Cannot read properties of null (reading 'name')` and the package cannot be published.
		'{"maintainers": [null]}',
		'{"maintainers": 1}',
		'{"contributors": [null]}',
		// Npm excludes `.git` and `.npmrc` with a `**/`-prefixed default rule, so they are ignored at any depth
		// and not only at the package root. Verified with `npm pack` on both majors.
		'{"files": ["sub/.npmrc"]}',
		'{"files": ["a/.git/config"]}',
		'{"files": ["a/b/.git/c"]}',
		// Npm refuses to install a package whose `devEngines` names an engine it does not recognize.
		'{"devEngines": {"foo": {"name": "x"}}}',
		'{"devEngines": {"RUNTIME": {"name": "node"}}}',
		'{"devEngines": {"runtime": {"name": "node"}, "nope": {"name": "x"}}}',
		// Npm also refuses to install when an entry carries a property it does not recognize.
		'{"devEngines": {"runtime": {"name": "node", "url": "x"}}}',
		'{"devEngines": {"runtime": [{"name": "node"}, {"name": "x", "url": "y"}]}}',
		// Npm reads only `packages` out of a `workspaces` object and uses it as the pattern list, so
		// anything else fails to install with `EWORKSPACESCONFIG`. Verified with `npm install` on both majors.
		'{"workspaces": {"nohoist": ["**/x"]}}',
		'{"workspaces": {"packages": "pkgs/*"}}',
		'{"workspaces": {"packages": [1]}}',
		'{"os": "nope"}',
		// `npm fund` drops a funding entry whose URL does not parse or is not `http:`/`https:`, so these are funding
		// links the author believes are there and nobody ever sees. Verified against libnpmfund's `isValidFunding`.
		'{"funding": "github:sindresorhus"}',
		'{"funding": "example.com"}',
		'{"funding": "mailto:user@example.com"}',
		'{"funding": "https://"}',
		'{"funding": {"url": "not a url"}}',
		'{"funding": [{"url": "ftp://example.com"}, "https://example.com"]}',
		// The shadowed duplicate of a subpath key is ignored, but the one npm resolves is not.
		'{"exports": {"./a": "./a.js", "./a": "./a/*.js"}}',
		// Npm checks a `bugs` `url` as a URL and an `email` as an email address, so each one that holds the
		// other shape is deleted, and the `bugs` object goes with it once it is empty.
		'{"bugs": {"url": "bugs@example.com"}}',
		'{"bugs": {"email": "https://example.com/issues"}}',
		'{"bugs": {"url": "https://example.com/issues", "email": "https://example.com/issues"}}',
		// Npm rebuilds the object from `url` and `email` alone, so one holding neither is deleted whole.
		'{"bugs": {"foo": "bar"}}',
		// SemVer allows no empty identifier, so a leading, trailing, or doubled dot in the prerelease or the
		// build metadata is not a version, and a numeric part may carry no leading zero.
		'{"packageManager": "npm@1.0.0-alpha."}',
		'{"packageManager": "npm@1.0.0-."}',
		'{"packageManager": "npm@1.0.0-alpha..1"}',
		'{"packageManager": "npm@1.0.0+build."}',
		'{"packageManager": "npm@1.0.0+build..1"}',
		// Corepack reads the field as a string and throws on anything else, so a value that is not one is not a
		// pinned package manager.
		'{"packageManager": true}',
		'{"packageManager": 1}',
		'{"packageManager": ["npm@10.8.2"]}',
		'{"packageManager": null}',
		'{"packageManager": {"name": "npm"}}',
		'{"packageManager": "npm@01.0.0"}',
		'{"packageManager": "npm@1.0.0@2.0.0"}',
		// The shadowed duplicate of an `imports` key is ignored, but the one Node resolves is not.
		'{"imports": {"#dep": "./dep.js", "#dep": 123}}',
		'{"imports": {"#dep": {"node": "./dep.js", "node": 123}}}',
		// The shadowed duplicate of an `engines` key is ignored, but the one npm reads is not.
		'{"engines": {"node": ">=18", "node": 18}}',
		// The shadowed duplicate of a `scripts` key is ignored, but the one npm runs is not.
		'{"scripts": {"build": "tsc", "build": 1}}',
		// The shadowed duplicate of a `bin` key is ignored, but the one npm installs is not.
		'{"bin": {"foo": "./cli.js", "foo": true}}',
		// The shadowed duplicate of an `overrides` key is ignored, but the one npm applies is not.
		'{"overrides": {"foo": "1.0.0", "foo": 1}}',
		// Npm splits a string `keywords` on `/,\s+/` and keeps the parts, so the comma-joined shorthand is a
		// form it supports and each part is checked on its own. No suggestion is offered, because removing or
		// rewriting one part of a joined string cannot be expressed as a fix.
		'{"keywords": ""}',
		'{"keywords": "A"}',
		'{"keywords": "a, B"}',
		'{"name": "p", "keywords": "p"}',
		'{"keywords": "  x  "}',
		'{"keywords": "a,b"}',
		// Npm keeps a keyword made of whitespace, so it is reported for the padding rather than for being
		// empty; only the empty string is one npm drops.
		'{"keywords": [" "]}',
		// Every part of a joined string is the same node, so a repeated keyword is reported once rather than
		// once per occurrence, all at the same range.
		'{"keywords": "a, a, a"}',
		'{"keywords": "a, b, a"}',
		// The same holds for a repeated keyword that is not lowercase, which would otherwise be reported once
		// per occurrence all at the same range.
		'{"keywords": "Foo, Bar, Foo"}',
		'{"keywords": "Foo, Foo, Foo"}',
		// A `type` the rule rejects on its own offers no replacement string, since the suggestion would only
		// trade the object report for the invalid-expression one.
		'{"license": {"type": "SEE LICENSE IN ", "url": "https://example.com/LICENSE"}}',
		'{"license": {"type": "MITT", "url": "https://example.com"}}',
		'{"license": {"type": "", "url": "https://example.com"}}',
		'{"license": {"type": 42, "url": "https://example.com"}}',
		// The string shorthand is a form npm supports, so a value that is neither form says both.
		'{"os": 42}',
		'{"cpu": 42}',
		'{"os": null}',
		// Npm reads a license from `licence` when `license` is missing or empty, and validates whichever it read.
		'{"licence": "MITT"}',
		// A `license` of any other shape is truthy, so npm reads it and the alias beside it is dead weight.
		'{"license": 5, "licence": "MIT"}',
		'{"license": true, "licence": "MIT"}',
		'{"license": {"type": "MIT", "url": "https://example.com/LICENSE"}, "licence": "MITT"}',
		'{"license": "", "licence": "MITT"}',
		'{"license": null, "licence": "MITT"}',
		'{"license": false, "licence": "MITT"}',
		'{"license": 0, "licence": "MITT"}',
		// Npm matches its ignore rules with `nocase`, so a casing variant of an always-ignored name is
		// excluded just as the name spelled its own way is.
		'{"files": ["YARN.LOCK"]}',
		'{"files": [".NPMRC"]}',
		'{"files": ["Node_Modules/foo"]}',
		'{"files": ["sub/.GIT"]}',
		'{"files": ["Package-Lock.json"]}',
		// The mixing error is real at the top level.
		'{"exports": {"import": "./a.js", "./b": "./b.js"}}',
		// A subpath key nested inside a top-level condition map is checked twice over, once standing in for the
		// missing subpath key and once against the key that is really there.
		'{"exports": {"types": {".": "./dist/*"}}}',
		'{"exports": {"node": {".": {"import": "./dist/*.mjs"}}}}',
		// The same target under two different subpath keys is a real difference, so both are still reported.
		'{"exports": {"./a": {"./b": "./dist/*.js"}}}',
		'{"bin": {}, "directories": {"bin": "./bin"}}',
		'{"bin": {"a/b": "./cli.js"}}',
		String.raw`{"bin": {"a\\b": "./cli.js"}}`,
		'{"license": "SEE LICENSE IN"}',
		// Npm publishes `semver.clean(version)`, which strips a leading run of `=` along with a `v` prefix, so an
		// `=` pin is a version npm accepts and rewrites rather than one it refuses. The fix has to take the whole
		// run, or `=v1.0.0` would land on `v1.0.0` and be reported again.
		'{"version": "=1.0.0"}',
		'{"version": "=v1.0.0"}',
		'{"version": "==1.0.0"}',
		'{"version": "= 1.0.0"}',
		'{"version": "=1.0.0+build.5"}',
		'{"license": "SEE LICENSE IN\t"}',
		// `libnpmpublish` throws `EUNSCOPED` for a restricted unscoped package, so the publish fails
		// rather than the field being ignored.
		'{"name": "foo", "version": "1.0.0", "publishConfig": {"access": "restricted"}}',
		// Lowercasing a keyword that another entry already holds in that spelling would create the duplicate
		// the same rule reports, so no conversion is offered.
		'{"keywords": ["Foo", "foo"]}',
		'{"keywords": ["foo", "Foo"]}',
		'{"keywords": ["Foo", "FOO"]}',
		// Npm takes the last path segment of a `bin` name, and drops one that normalizes to nothing.
		'{"bin": {"": "./cli.js"}}',
		'{"bin": {".": "./cli.js"}}',
		'{"bin": {"..": "./cli.js"}}',
		'{"bin": {"/": "./cli.js"}}',
		'{"bin": ["a/../.."]}',
		// A `.` entry holds the version for the package the enclosing entry names, so npm reads its value as
		// a version string and a truthy non-string one fails the install. A falsy one is never looked at, and
		// a `.` on the top-level `overrides` object belongs to no package at all.
		'{"overrides": {"lodash": {".": {"x": "1.0.0"}}}}',
		'{"overrides": {"lodash": {".": 1}}}',
		'{"overrides": {"lodash": {".": true}}}',
		'{"overrides": {"lodash": {".": []}}}',
		// Every key but `.` names a package, and npm reads each one before it installs anything.
		'{"overrides": {"$foo": {".": "1.0.0"}}}',
		'{"overrides": {"": "1.0.0"}}',
		'{"overrides": {"foo bar": "1.0.0"}}',
		'{"overrides": {"@/dep": "1.0.0"}}',
		'{"overrides": {"foo": {"@/dep": "1.0.0"}}}',
		// An absolute path on the author's machine. Prefixing it with `./` names a different file, so the rewrite is only a suggestion.
		'{"exports": {".": "/Users/me/project/dist/index.js"}}',
		// Anywhere but alone, npm compares `any` as a platform name, so `["any", "!win32"]` installs nowhere.
		'{"os": ["any", "!win32"]}',
		'{"os": ["any", "linux"]}',
		// Npm 12 force-excludes these from every tarball, even when `files` names them.
		'{"files": ["npm-shrinkwrap.json"]}',
		'{"files": ["/npm-shrinkwrap.json"]}',
		'{"files": ["bun.lock"]}',
		'{"files": [".npm-extension.cjs"]}',
		'{"files": [".npm-extension.mjs"]}',
		// The old `web` spelling is not modelled, so a URL held only there is reported as keeping nothing, although npm copies it to `url`. This is a documented limitation.
		'{"bugs": {"web": "https://example.com/issues"}}',
		'{"dependencies": {"foo": "1"}, "bundleDependencies": ["bar"], "bundledDependencies": ["foo"]}',
		'{"bundleDependencies": {"bar": true}}',
		// The entry npm reads is orphaned, and removing it takes the shadowed duplicate too, which would otherwise take its place.
		'{"peerDependencies": {"b": "1"}, "peerDependenciesMeta": {"a": {"optional": true}, "a": {}, "b": {"optional": true}}}',
		// Only the value `no-empty-fields` reports is skipped: the effective duplicate here is not empty.
		'{"license": "", "license": "MITT"}',
		// The whole prefix goes in one fix, including a `v` behind the space.
		'{"version": "= v1.0.0"}',
		// Npm reads a version loosely and publishes these rewritten, so they are not canonical rather than invalid.
		'{"version": "01.0.0"}',
		'{"version": "1.0.0beta"}',
	],
});
