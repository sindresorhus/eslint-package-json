import {getTester} from './utils/test.js';

const {test} = getTester(import.meta);

test.snapshot({
	valid: [
		// Node resolves an extensionless `main` through CJS extension search, so `"index"` is the file `./index.js`.
		'{"main": "index", "exports": {".": {"require": "./index.js", "import": "./index.mjs"}}}',
		'{"main": "./lib", "exports": {".": "./lib/index.js"}}',
		'{"main": "foo.bar", "exports": {".": "./foo.bar.js"}}',
		'{"main": "index", "exports": {".": "./index.json"}}',
		'{"main": "index", "exports": {".": "./index.node"}}',
		// `.` and `./` name the package root, which Node resolves through the same extension search as any other directory.
		'{"main": ".", "exports": {"default": "./index.js"}}',
		'{"main": "./", "exports": {"default": "./index.js"}}',
		// A trailing slash does not make a directory a different path.
		'{"main": "./lib/", "exports": {".": "./lib/index.js"}}',
		// Has a `.` root entry.
		`{
			"exports": {
				".": "./index.js",
				"./sub": "./sub.js"
			}
		}`,
		// Conditions object is itself the root.
		'{"exports": {"import": "./index.js", "default": "./index.cjs"}}',
		// The root reaches the declared primary entry point.
		'{"main": "./index.js", "exports": {".": {"import": "./index.js", "default": "./index.cjs"}}}',
		// String shorthand.
		'{"exports": "./index.js"}',
		// No `exports`.
		'{"name": "foo"}',
	],
	invalid: [
		// A `types` condition pointing at a non-declaration file is still not a runtime entry point.
		'{"exports": {".": {"types": "./a.ts"}}}',
		// An empty `exports` object is a conditions object with nothing in it, not a subpath map.
		'{"exports": {}}',
		// A plain `types` condition is not a runtime entry point either.
		'{"exports": {".": {"types": "./a.d.ts"}}}',
		// A versioned `types` condition is not a runtime entry point.
		'{"exports": {".": {"types@>=5.0": "./a.d.ts"}}}',
		'{"exports": {"./sub": "./sub.js"}}',
		`{
			"exports": {
				"./sub": "./sub.js",
				"./package.json": "./package.json"
			}
		}`,
		// A null root blocks runtime access.
		'{"exports": {".": null}}',
		// A type-only root is not a usable package entry point.
		'{"exports": {".": {"types": "./index.d.ts"}}}',
		// The root must expose `main` when it is declared.
		'{"main": "./index.js", "exports": {".": "./index.mjs"}}',
		// An extensionless `main` with no plausible resolution is still a mismatch.
		'{"main": "lib", "exports": {".": "./dist/index.js"}}',
		// The package root resolves through extension search, not to whatever the root export happens to be.
		'{"main": ".", "exports": {"default": "./dist/index.js"}}',
		'{"main": ".", "exports": {".": "./.js"}}',
		'{"main": ".", "exports": {".": "./"}}',
		'{"main": "dist", "exports": {".": "./dist/"}}',
		'{"main": "index", "exports": {".": "./index.cjs"}}',
		// A shadowed duplicate is not part of the object Node resolves, so the runtime target hiding under it must not make the root look usable.
		'{"exports": {".": {"types": "./a.d.ts", "import": "./a.js", "import": "./a.d.ts"}}}',
		// The same holds when a shadowed duplicate is the only thing matching `main`.
		'{"main": "./a.js", "exports": {".": {"import": "./a.js", "import": "./b.js"}}}',
	],
});
