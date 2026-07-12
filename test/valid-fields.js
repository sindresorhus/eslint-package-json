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
		// Non-string `name` is out of scope.
		'{"name": 123}',
		// `version`
		'{"version": "1.0.0"}',
		'{"version": "1.0.0-beta.1"}',
		'{"version": "0.0.0"}',
		// Build metadata is valid and must be preserved (not flagged).
		'{"version": "1.2.3+build.5"}',
		// Out of scope.
		'{"name": "foo"}',
		'{"version": 1}',
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
		'{"license": "(MIT OR Apache-2.0)"}',
		'{"license": "Apache-2.0"}',
		// SPDX `WITH` exception.
		'{"license": "Apache-2.0 WITH LLVM-exception"}',
		// SPDX `AND` compound.
		'{"license": "(MIT AND ISC)"}',
		'{"license": "UNLICENSED"}',
		'{"license": "SEE LICENSE IN LICENSE.md"}',
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
		// Entry-point fields accept strings.
		'{"main": "./index.js", "module": "./index.mjs", "types": "./index.d.ts", "typings": "./index.d.ts"}',
		'{"browser": "./browser.js"}',
		'{"browser": "../browser.js"}',
		'{"browser": {"./server.js": "./browser.js", "./fs.js": false}}',
		'{"browser": {"../server.js": "./browser.js", "./server/../server.js": "./browser.js", "./server.js": "../browser.js", "./other.js": "./browser/../browser.js"}}',
		// Empty string is handled by `no-empty-fields`.
		'{"type": ""}',
		// `exports`
		// String exports value.
		'{"exports": "./index.js"}',
		// An empty object has no conditions or subpaths to check.
		'{"exports": {}}',
		// Simple subpath.
		'{"exports": {".": "./index.js"}}',
		// Correct order: types first, default last.
		'{"exports": {"types": "./index.d.ts", "default": "./index.js"}}',
		// Correct order with more conditions.
		'{"exports": {"types": "./index.d.ts", "import": "./index.mjs", "default": "./index.js"}}',
		// Condition ordering is owned by the dedicated condition rules.
		'{"exports": {"default": "./index.js", "import": "./index.mjs"}}',
		'{"exports": {"import": "./index.mjs", "types": "./index.d.ts", "default": "./index.js"}}',
		'{"exports": {"import": "./index.mjs", "default": "./index.js", "types": "./index.d.ts"}}',
		// Nested subpaths with correct ordering.
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
		// `module` before `require`.
		'{"exports": {"module": "./index.mjs", "require": "./index.cjs", "default": "./index.js"}}',
		// Subpath map (all keys are subpaths).
		'{"exports": {".": "./index.js", "./feature": "./feature.js"}}',
		// Per-condition `types` with valid declaration-file extensions.
		'{"exports": {"types": "./index.d.ts", "default": "./index.js"}}',
		'{"exports": {"import": {"types": "./index.d.mts", "default": "./index.mjs"}, "require": {"types": "./index.d.cts", "default": "./index.cjs"}}}',
		// A dual `import`/`require` pair with distinct declaration files is correct.
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
		'{"imports": {"#internal/*.js": "./src/internal/*.js"}}',
		'{"imports": {"#/internal": "./src/internal.js"}}',
		'{"imports": {"#external": "foo/../bar"}}',
		'{"imports": {"#nested": "foo/node_modules/bar"}}',
		'{"imports": {"#colon": "foo/bar:baz"}}',
		'{"imports": {"#percent": "foo/%25"}}',
		// Correctly ordered conditions inside an entry.
		'{"imports": {"#dep": {"types": "./dep.d.ts", "import": "./dep.mjs", "default": "./dep.js"}}}',
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
		// Non-string values are ignored.
		'{"engines": {"node": 18}}',
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
		// `os`
		'{"name": "foo"}',
		'{"os": ["darwin", "linux"]}',
		'{"os": ["!win32"]}',
		// `cpu`
		'{"name": "foo"}',
		'{"cpu": ["x64", "arm64"]}',
		'{"cpu": ["!arm64"]}',
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
		// Non-string values are left to other tooling.
		'{"packageManager": true}',
		// `scripts`
		'{"name": "foo"}',
		'{"scripts": {"build": "tsc", "test": "node --test"}}',
		'{"scripts": {}}',
		// `files`
		'{"name": "foo"}',
		'{"files": ["dist", "index.js"]}',
		'{"files": ["src/**/*.js"]}',
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
		// A `false` value is tolerated by npm as a no-op meaning "bundle nothing".
		'{"bundledDependencies": false}',
		// `overrides`
		'{"name": "foo"}',
		'{"overrides": {"foo": "1.0.0"}}',
		// Nested override.
		'{"overrides": {"foo": {"bar": "1.0.0"}}}',
		// Mirror form and self-key are plain strings.
		'{"overrides": {"foo": "$foo", "bar": {".": "1.0.0"}}}',
	],
	invalid: [
		// `name`
		'{"name": "Foo"}',
		'{"name": " foo"}',
		'{"name": ".foo"}',
		'{"name": "foo bar"}',
		'{"name": "node_modules"}',
		'{"name": "@scope/"}',
		'{"name": ""}',
		'{"name": "excited!"}',
		// `version`
		'{"version": "1.0"}',
		'{"version": "^1.0.0"}',
		'{"version": "latest"}',
		'{"version": ""}',
		'{"version": "v1.0.0.0"}',
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
		'{"license": ""}',
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
		'{"repository": []}',
		'{"repository": null}',
		// `homepage`
		'{"homepage": "git@github.com:user/repo.git"}',
		'{"homepage": "example.com"}',
		'{"homepage": 42}',
		'{"homepage": ""}',
		// `bugs`
		'{"bugs": 123}',
		'{"bugs": ["https://example.com"]}',
		'{"bugs": {"url": 1}}',
		'{"bugs": {"email": false}}',
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
		// Entry-point fields must be strings.
		'{"main": false}',
		'{"module": []}',
		'{"types": 42}',
		'{"typings": null}',
		'{"browser": 42}',
		'{"browser": {"./server.js": []}}',
		'{"browser": "C:/browser.js"}',
		String.raw`{"browser": "C:\\browser.js"}`,
		String.raw`{"browser": "\\\\server\\share\\browser.js"}`,
		'{"browser": {"./server.js": "https://cdn.example.com/browser.js"}}',
		'{"type": true}',
		'{"type": 42}',
		// `exports`
		// Non-relative path (missing `./`).
		'{"exports": {"default": "index.js"}}',
		// A `../` path is flagged but not autofixed (prepending `./` would not make it valid).
		'{"exports": {"default": "../index.js"}}',
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
		'{"exports": {"default": 123}}',
		'{"exports": {"default": true}}',
		'{"exports": {"default": "./dist/../index.js"}}',
		'{"exports": {"default": "./dist/%2e%2e/index.js"}}',
		'{"exports": {"default": "./node_modules/foo.js"}}',
		'{"exports": {"./utils/./helper.js": "./utils/helper.js"}}',
		'{"exports": {"0": "./index.js"}}',
		'{"exports": null}',
		// String exports without ./
		'{"exports": "index.js"}',
		// Non-relative path inside an array fallback.
		'{"exports": {".": ["a.js", "./b.js"]}}',
		// `module` after `require`.
		`{
	"exports": {
		"require": "./index.cjs",
		"module": "./index.mjs",
		"default": "./index.js"
	}
}`,
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
		'{"imports": {"#dep": "./dep/../index.js"}}',
		'{"imports": {"#dep": "./dist/%2e%2e/index.js"}}',
		'{"imports": {"#": "./dep.js"}}',
		'{"imports": {"#dep/": "./dep.js"}}',
		'{"imports": {"#dep/../other": "./dep.js"}}',
		'{"imports": {"#dep": "https://example.com/dep.js"}}',
		'{"imports": {"#dep": "."}}',
		'{"imports": {"#dep": "node:"}}',
		'{"imports": {"#fs": "node:fs"}}',
		'{"imports": {"#percent": "foo/%"}}',
		'{"imports": {"#percent": "foo/%zz"}}',
		'{"imports": {"#percent": "foo/%2"}}',
		'{"imports": {"#dep": {"0": "./dep.js"}}}',
		// `module` after `require` inside an entry's conditions.
		`{
	"imports": {
		"#dep": {
			"require": "./dep.cjs",
			"module": "./dep.mjs",
			"default": "./dep.js"
		}
	}
}`,
		// `bin`
		'{"bin": ["./cli.js"]}',
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
		'{"sideEffects": {}}',
		'{"sideEffects": ["./src/polyfill.js", 1]}',
		'{"sideEffects": ["./src/polyfill.js", null]}',
		// `engines`
		'{"engines": {"node": ">=foo"}}',
		'{"engines": {"node": "not a range"}}',
		'{"engines": {"node": ">=18", "npm": "garbage"}}',
		'{"engines": {"node": ">= 18 || garbage"}}',
		// An empty range is `*` to semver, but almost certainly a forgotten constraint.
		'{"engines": {"node": ""}}',
		'{"engines": {"node": "  "}}',
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
		// Empty version is `*` to semver, but almost certainly a forgotten constraint.
		'{"devEngines": {"runtime": {"name": "node", "version": ""}}}',
		// Invalid onFail.
		'{"devEngines": {"runtime": {"name": "node", "onFail": "explode"}}}',
		// `os`
		'{"os": ["macos"]}',
		'{"os": ["windows"]}',
		'{"os": ["darwin", "osx"]}',
		'{"os": "darwin"}',
		'{"os": ["darwin", "!win32"]}',
		// Non-string element.
		'{"os": [42]}',
		// `cpu`
		'{"cpu": ["amd64"]}',
		'{"cpu": ["x86_64"]}',
		'{"cpu": ["aarch64"]}',
		'{"cpu": "x64"}',
		'{"cpu": ["x64", "!ia32"]}',
		// Non-string element.
		'{"cpu": [42]}',
		// `publishConfig`
		'{"publishConfig": "public"}',
		'{"publishConfig": {"access": "private"}}',
		'{"publishConfig": {"access": true}}',
		'{"publishConfig": {"provenance": "true"}}',
		// `access` is redundant for an unscoped package, regardless of its value.
		'{"name": "foo", "publishConfig": {"access": "public"}}',
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
		'{"scripts": []}',
		'{"scripts": "build"}',
		'{"scripts": {"build": 1}}',
		'{"scripts": {"build": "tsc", "test": false}}',
		// `files`
		'{"files": "dist"}',
		'{"files": ["node_modules"]}',
		'{"files": ["node_modules/foo"]}',
		'{"files": ["yarn.lock"]}',
		'{"files": ["bun.lock"]}',
		'{"files": ["dist", ".git"]}',
		'{"files": [1]}',
		'{"files": ["dist", ""]}',
		// `workspaces`
		'{"workspaces": "packages/*"}',
		'{"workspaces": ["packages/*", 1]}',
		'{"workspaces": null}',
		// `keywords`
		'{"keywords": "eslint"}',
		'{"keywords": {"0": "eslint"}}',
		'{"keywords": ["eslint", 1]}',
		'{"keywords": ["eslint", ""]}',
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
		'{"peerDependenciesMeta": {"a": {"optional": true}}}',
		// The redundant value is still reported alongside the orphaned entry.
		'{"peerDependenciesMeta": {"a": {"optional": false}}}',
		'{"peerDependencies": {"a": "1.0.0"}, "peerDependenciesMeta": {"a": {"optional": true}, "b": {"optional": true}}}',
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
		'{"bundledDependencies": "foo"}',
		'{"bundledDependencies": [1]}',
		'{"bundledDependencies": ["foo"]}',
		'{"dependencies": {"foo": "^1.0.0"}, "bundledDependencies": ["foo", "bar"]}',
		// A peer dependency is not published, so it does not satisfy the bundle requirement.
		'{"peerDependencies": {"foo": ">=1"}, "bundledDependencies": ["foo"]}',
		// A `true` value is warned on and deleted by npm (it must be an array).
		'{"bundledDependencies": true}',
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
	],
});
