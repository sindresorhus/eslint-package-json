import {getTester} from './utils/test.js';

const {test} = getTester(import.meta);

test.snapshot({
	valid: [
		// A shadowed duplicate is not part of the object TypeScript resolves, so the bad declaration hiding under it must not be reported. The reverse order is reported; see the invalid cases.
		'{"exports": {".": {"types": "./a.js", "types": "./a.d.ts", "default": "./a.js"}}}',
		// No `exports` field.
		'{"types": "./index.d.ts"}',
		// No type metadata means this rule has no type coverage contract to check.
		'{"exports": "./index.js"}',
		// A top-level declaration does not describe each exported branch, so add a type condition.
		'{"types": "./index.d.ts", "exports": {"types": "./index.d.ts", "default": "./index.js"}}',
		// The versioned TypeScript condition is also a type condition and must be first.
		'{"exports": {"types@": "./index.d.ts", "default": "./index.js"}}',
		'{"exports": {"types@ ": "./index.d.ts", "default": "./index.js"}}',
		'{"exports": {"types@>=5": "./index.d.mts", "default": "./index.mjs"}}',
		'{"exports": {"types@>=4.7 <5.5": "./index.d.ts", "default": "./index.js"}}',
		'{"exports": {"types@4.7 - 5.5": "./index.d.ts", "default": "./index.js"}}',
		'{"exports": {"types@>=5 || <4": "./index.d.ts", "default": "./index.js"}}',
		'{"exports": {"types@ || >=5": "./index.d.ts", "default": "./index.js"}}',
		'{"exports": {"types@>=5.0.0-beta.1+build.2": "./index.d.ts", "default": "./index.js"}}',
		'{"exports": {"types@>=5.2": "./ts5.d.ts", "types@>=4.7": "./ts4.7.d.ts", "types": "./index.d.ts", "default": "./index.js"}}',
		`{
	"exports": {
		"types@>=5.2": {"import": "./import.d.ts"},
		"types": {"import": "./import.d.ts", "require": "./require.d.ts"},
		"import": "./import.js",
		"require": "./require.js"
	}
}`,
		'{"exports": {"types": {"import": {"browser": "./browser.d.ts"}, "default": "./fallback.d.ts"}, "import": "./import.js"}}',
		// Non-empty declaration and runtime fallback arrays are covered.
		'{"exports": {"types": ["./index.d.ts", "./fallback.d.ts"], "default": ["./index.js", "./fallback.js"]}}',
		// Array validation stops after the first target.
		'{"exports": {"types": ["./index.d.ts", "./not-a-declaration.js"], "default": "./index.js"}}',
		// A nested versioned type condition can be the only type branch.
		'{"exports": {"types": {"import": {"types@>=5": "./import.d.ts"}}, "import": {"import": "./import.js"}}}',
		// An unresolved nested unversioned type condition can fall through to a default.
		'{"type": "module", "exports": {"types": {"types": {"browser": "./browser.d.mts"}, "default": "./fallback.d.mts"}, "default": "./index.js"}}',
		// Nested declaration arrays also stop after the first target.
		'{"type": "module", "exports": {"types": {"import": ["./index.d.mts", "./unreachable.js"]}, "import": "./index.mjs"}}',
		// A non-runtime sibling does not invalidate a covered runtime branch.
		'{"exports": {"types": {"import": [], "default": {"node": "./node.d.ts"}}, "import": {"node": "./node.js", "browser": null}}}',
		// A null array target makes later runtime targets unreachable to this static check.
		'{"exports": {"types": "./index.d.ts", "default": [null, "./fallback.js"]}}',
		'{"exports": {"types": [{"default": "./fallback.d.ts"}, {"types": null}], "default": "./index.js"}}',
		// An empty type-target array falls through to the parent default.
		'{"exports": {"types": {"import": [], "default": "./fallback.d.ts"}, "import": "./import.js"}}',
		// A parent default can continue into a nested runtime condition.
		'{"exports": {"types": {"import": [], "default": {"import": "./fallback.d.ts"}}, "import": "./import.js"}}',
		'{"exports": {"types": {"import": "./import.d.ts", "require": "./require.d.ts"}, "import": "./import.js", "require": "./require.js"}}',
		// A nested type condition covers every runtime branch in that conditions object.
		'{"exports": {".": {"types": "./index.d.ts", "import": "./index.js", "default": "./index.cjs"}}}',
		// A declaration string covers every runtime leaf below its branch.
		'{"exports": {"types": "./index.d.ts", "default": {"node": "./index.js", "browser": "./browser.js"}}}',
		// Non-JavaScript export targets do not need declaration coverage.
		'{"exports": {"types": "./index.d.ts", "default": "./package.json"}}',
		// TypeScript supports caret, tilde, and wildcard selectors.
		'{"exports": {"types@^5 || ~4.7 || 3.x": "./index.d.ts", "default": "./index.js"}}',
		// Both TypeScript modes set `import`, so they find the declaration under `types` before they reach the `default` JavaScript.
		'{"exports": {"types": {"import": "./index.d.mts"}, "default": {"import": "./index.mjs"}}}',
		'{"exports": {"types": {"import": {"default": "./fallback.d.mts"}}, "default": {"import": {"default": "./fallback.mjs"}}}}',
		'{"exports": {".": {"types": {"import": "./index.d.mts"}, "default": {"import": "./index.mjs"}}}}',
		// TypeScript resolves with `types`, `node`, and `import` under `nodenext`, and with `types` and `import` under `bundler`. Each fixture below is typed in both modes by `tsc`, with the declarations in another directory than the JavaScript.
		'{"exports": {"require": {"types": "./t/i.d.ts", "default": "./index.js"}, "import": {"types": "./t/esm.d.mts", "default": "./esm.mjs"}, "default": "./index.js"}}',
		'{"type": "module", "exports": {"types": {"import": "./t/i.d.ts", "require": "./t/i.d.cts"}, "node": "./n.js", "default": "./i.js"}}',
		'{"type": "module", "exports": {"types": {"require": "./i.d.cts", "default": "./i.d.ts"}, "default": {"require": "./i.cjs", "default": "./i.js"}}}',
		// `bundler` never sets `node`, so it reaches the `default` target, which the same `types` covers.
		`{
	"exports": {
		".": {
			"import": {"types": "./dist/vue.d.mts", "node": "./index.mjs", "default": "./dist/vue.runtime.esm-bundler.js"},
			"require": {"types": "./dist/vue.d.ts", "default": "./index.js"}
		}
	}
}`,
		// TypeScript never sets `bun`, `browser`, `react-native`, `source`, or `@zod/source`, so a condition ahead of `types` that only those reach does not hide it.
		'{"exports": {"bun": "./dist/bun.mjs", "types": "./dist/generic.d.ts", "default": "./dist/generic.js"}}',
		`{
	"type": "module",
	"exports": {
		".": {
			"import": {
				"browser": {"types": "./dist/esm/browser/index.d.ts", "default": "./dist/esm/browser/index.min.js"},
				"react-native": {"types": "./dist/esm/react-native/index.d.ts", "default": "./dist/esm/react-native/index.min.js"},
				"node": {"types": "./dist/esm/node/index.d.ts", "default": "./dist/esm/node/index.min.js"},
				"types": "./dist/esm/index.d.ts",
				"default": "./dist/esm/index.min.js"
			},
			"require": {
				"browser": {"types": "./dist/commonjs/browser/index.d.ts", "default": "./dist/commonjs/browser/index.min.js"},
				"react-native": {"types": "./dist/commonjs/react-native/index.d.ts", "default": "./dist/commonjs/react-native/index.min.js"},
				"node": {"types": "./dist/commonjs/node/index.d.ts", "default": "./dist/commonjs/node/index.min.js"},
				"types": "./dist/commonjs/index.d.ts",
				"default": "./dist/commonjs/index.min.js"
			}
		}
	}
}`,
		`{
	"type": "module",
	"exports": {
		".": {
			"import": {"source": "./src/index.ts", "types": "./dist/esm/index.d.ts", "default": "./dist/esm/index.js"},
			"require": {"source": "./src/index.ts", "types": "./dist/commonjs/index.d.ts", "default": "./dist/commonjs/index.js"}
		}
	}
}`,
		// A pattern target gets its extension from the specifier.
		'{"exports": {".": {"types": "./dist/index.d.ts", "default": "./dist/index.js"}, "./types/*": {"types": "./types/*"}}}',
		// TypeScript skips an array element that is not a relative path and takes the next one.
		'{"exports": {"types": ["", "./index.d.ts"], "default": "./index.js"}}',
		// No TypeScript mode sets `browser`, so the JavaScript behind it is never loaded without types.
		'{"exports": {"types": {"import": {"node": "./node.d.ts"}}, "import": {"node": "./node.js", "browser": "./browser.js"}}}',
		'{"exports": {"types@>=5": {"import": {"node": "./node.d.ts"}}, "import": {"node": "./node.js", "browser": "./browser.js"}}}',
		// TypeScript looks past JavaScript with no declaration next to it, so the next array element types the export.
		'{"types": "./index.d.ts", "exports": [{"default": "./index.js"}, {"types": "./index.d.ts"}]}',
		// CommonJS consumers are out of scope, so JavaScript that only `require` reaches needs no declaration.
		'{"types": "./index.d.ts", "exports": {"import": {"types": "./index.d.mts", "default": "./index.mjs"}, "require": "./index.cjs"}}',
		'{"exports": {"import": {"types": "./index.d.mts", "default": "./index.mjs"}, "require": {"default": "./index.cjs"}}}',
		'{"exports": {"types": {"import": "./import.d.ts"}, "import": "./import.js", "require": "./require.js"}}',
		'{"exports": {"types": {"default": {"import": "./import.d.ts"}}, "default": {"import": "./import.js", "require": "./require.js"}}}',
		'{"exports": {"types": {"import": "./index.d.mts"}, "default": {"require": "./index.cjs"}}}',
		'{"exports": {"types": {"import": "./i.d.mts"}, "default": "./i.mjs"}}',
		'{"exports": {"types": {"types": {"import": "./i.d.mts"}}, "default": "./i.mjs"}}',
		'{"exports": {"./x": {"types": {"import": "./i.d.mts"}, "default": "./i.mjs"}}}',
		'{"exports": {"types": {"import": "./types/i.d.mts"}, "require": "./i.cjs", "default": "./i.mjs"}}',
		// No TypeScript mode sets `require`, so a `require` target ahead of `types` does not hide it.
		'{"exports": {"require": "./i.cjs", "types": "./i.d.ts", "default": "./i.js"}}',
	],
	invalid: [
		// A top-level declaration does not cover an exported runtime branch.
		'{"types": "./index.d.ts", "exports": "./index.js"}',
		// TypeScript ignores the top-level `types` field once `exports` is present, including for a `.` subpath.
		'{"types": "./index.d.ts", "exports": {".": "./index.js"}}',
		'{"typings": "./index.d.ts", "exports": {".": "./index.js", "./sub": "./sub.js"}}',
		'{"typings": "./index.d.ts", "exports": {".": "./index.js"}}',
		// Type conditions must come before runtime conditions, including versioned ones.
		'{"exports": {"default": "./index.js", "types": "./index.d.ts"}}',
		'{"exports": {"default": "./index.mjs", "types@>=5": "./index.d.mts"}}',
		'{"exports": {"types@>=5": "./index.d.ts", "default": "./index.js", "types@>=4": "./index.d.ts"}}',
		'{"exports": {"import": {"default": "./index.js", "types": "./index.d.ts"}}}',
		// Versioned type conditions must use TypeScript-compatible semver syntax and do not provide coverage otherwise.
		'{"exports": {"types@invalid": "./index.d.ts", "default": "./index.js"}}',
		'{"exports": {"types@v5": "./index.d.ts", "default": "./index.js"}}',
		'{"exports": {"types@>= 5": "./index.d.ts", "default": "./index.js"}}',
		'{"exports": {"types@1.0.0-K": "./index.d.ts", "default": "./index.js"}}',
		'{"exports": {"types@1.0.0-01": "./index.d.ts", "default": "./index.js"}}',
		'{"exports": {"types@1.0.0-a..b": "./index.d.ts", "default": "./index.js"}}',
		'{"exports": {"types@1.0.0+foo..bar": "./index.d.ts", "default": "./index.js"}}',
		// A hyphen range with an unparseable bound is not TypeScript-compatible semver.
		'{"exports": {"types@1 - abc": "./index.d.ts", "default": "./index.js"}}',
		'{"exports": {"types": {"types@v5": "./index.d.ts"}, "default": "./index.js"}}',
		// Type conditions must point to declaration files. A `types` value that is not a path at all (`true`, `false`, `""`) is left to `valid-fields` and only reported as missing.
		'{"exports": {"types": "./index.js", "default": "./index.js"}}',
		'{"exports": {"types": "./index.ts", "default": "./index.mjs"}}',
		'{"exports": {"types": "./index.D.TS", "default": "./index.js"}}',
		'{"exports": {"types": null, "default": "./index.js"}}',
		'{"exports": {"types": true, "default": "./index.js"}}',
		'{"exports": {"types": false, "default": "./index.js"}}',
		'{"exports": {"types": "", "default": "./index.js"}}',
		'{"exports": {"types": {"import": "./index.d.ts", "browser": "./not-a-declaration.js"}, "import": "./index.js"}}',
		// Nested type conditions receive the same ordering and value validation.
		'{"exports": {"types": {"default": "./legacy.d.ts", "types@>=5": "./modern.d.ts"}, "default": "./index.js"}}',
		'{"exports": {"types": {"types": null, "default": "./fallback.d.ts"}, "default": "./index.js"}}',
		// A null first array target prevents later declaration targets from participating in this static check.
		'{"exports": {"types": [null, "./index.d.ts"], "default": ["./index.js", "./fallback.js"]}}',
		// The same first-target boundary applies to nested declaration arrays.
		'{"exports": {"types": {"import": [null, "./index.d.ts"], "default": "./fallback.d.ts"}, "import": "./index.js"}}',
		// A nested default null target does not fall through to its parent declaration fallback.
		'{"exports": {"types": {"import": {"default": null}, "default": "./fallback.d.ts"}, "import": "./index.js"}}',
		// An inactive nested condition does not provide coverage when its default is null.
		'{"exports": {"types": {"import": {"browser": "./browser.d.ts", "default": null}, "default": "./fallback.d.ts"}, "import": {"node": "./index.js"}}}',
		'{"exports": {"types": {"import": {"browser": "./browser.d.ts", "default": null}, "default": "./fallback.d.ts"}, "import": "./index.js"}}',
		// An active named null target does not fall through to its parent declaration fallback.
		'{"exports": {"types": {"import": {"node": null}, "default": "./fallback.d.ts"}, "import": {"node": "./index.js"}}}',
		// Every exported branch needs its own type condition.
		'{"exports": {".": {"types": "./index.d.ts", "default": "./index.js"}, "./feature": "./feature.js"}}',
		// Empty versioned type targets are invalid even when an unversioned fallback exists.
		'{"type": "module", "exports": {"types": {"types@>=5": [], "types": {"import": "./import.d.mts", "require": "./require.d.cts"}}, "import": "./import.mjs", "require": "./require.cjs"}}',
		// Partial type coverage should only report the uncovered sibling.
		'{"exports": {"types": {"import": {"node": "./node.d.ts"}}, "import": {"node": "./node.js", "default": "./other.js"}}}',
		'{"exports": {"types@>=5": {"import": {"node": "./node.d.ts"}}, "import": {"node": "./node.js", "default": "./other.js"}}}',
		// TypeScript rejects a whitespace-only alternative between disjunctions.
		'{"exports": {"types@>=5 ||   || <4": "./index.d.ts", "default": "./index.js"}}',
		// The unversioned fallback must not make a later versioned type condition unreachable.
		'{"exports": {"types": "./fallback.d.ts", "types@>=5": "./modern.d.ts", "default": "./index.js"}}',
		// A malformed type condition is not also a runtime condition.
		'{"type": "module", "exports": {"types@invalid": "./invalid.cjs", "types": "./index.d.mts", "default": "./index.mjs"}}',
		// An active nested `types` null target also prevents its parent declaration fallback from participating.
		'{"type": "module", "exports": {"types": {"import": {"types": null}, "default": "./fallback.d.cts"}, "import": "./index.js"}}',
		// A local default still participates after an empty nested `types` target and can prevent a parent fallback.
		'{"type": "module", "exports": {"types": {"import": {"types": [], "default": null}, "default": "./fallback.d.cts"}, "import": "./index.js"}}',
		// A terminal versioned branch cannot use the later unversioned type fallback.
		'{"type": "module", "exports": {"types@>=5": {"import": null, "require": "./r.d.cts"}, "types": {"import": "./i.d.mts", "require": "./r.d.cts"}, "import": "./i.mjs", "require": "./r.cjs"}}',
		// Generic target-type validation belongs to `valid-fields`.
		'{"exports": {"types": 1, "default": "./index.js"}}',
		// A terminal type condition prevents a declaration-side default from participating.
		'{"type": "module", "exports": {"types": {"types": null, "default": "./fallback.d.cts"}, "default": "./index.mjs"}}',
		// When the *effective* `types` is the bad one, it is reported and the shadowed good one does not excuse it.
		'{"exports": {".": {"types": "./a.d.ts", "types": "./a.js", "default": "./a.js"}}}',
		// A `default` branch whose conditions the types object cannot answer is still uncovered.
		'{"exports": {"types": {"browser": "./index.d.ts"}, "default": {"import": "./index.mjs"}}}',
		// A `browser`, `module`, `worker` or `deno` condition is consulted by its own toolchain, not
		// by a node resolution, so a declaration behind one does not cover a `default` string target.
		// Checked with `tsc` under `nodenext`, which leaves these untyped for an importer.
		'{"exports": {"types": {"browser": "./index.d.ts"}, "default": "./index.mjs"}}',
		'{"exports": {"types": {"module": "./index.d.ts"}, "default": "./index.mjs"}}',
		'{"exports": {"types": {"worker": "./index.d.ts"}, "default": "./index.mjs"}}',
		'{"exports": {"types": {"deno": "./index.d.ts"}, "default": "./index.mjs"}}',
		// `module-sync` and `node-addons` are real Node conditions that TypeScript never asks for, so
		// a declaration behind either leaves an importer untyped just the same.
		'{"exports": {"types": {"module-sync": "./index.d.ts"}, "default": "./index.mjs"}}',
		'{"exports": {"types": {"node-addons": "./index.d.ts"}, "default": "./index.mjs"}}',
		'{"exports": {"types": {"import": {"browser": "./index.d.ts"}}, "default": "./index.mjs"}}',
		'{"exports": {"types": {"types@>=5": {"browser": "./index.d.ts"}}, "default": "./index.mjs"}}',
		// A `null` under `import` answers an importing consumer with nothing, and the declaration behind
		// `default` is never consulted.
		'{"type": "module", "exports": {"types": {"import": null, "default": "./i.d.mts"}, "default": "./i.mjs"}}',
		// A `types` object that answers only `require` leaves an importer of the `default` target untyped.
		'{"exports": {"types": {"require": "./i.d.cts"}, "default": "./i.cjs"}}',
		// The `null` answers an ESM importer with nothing, wherever it sits among the keys.
		'{"exports": {"types": {"require": "./i.d.cts", "import": null}, "default": "./i.cjs"}}',
		'{"exports": {"types": {"import": null, "require": "./i.d.cts"}, "default": "./i.cjs"}}',
		// `bundler` resolution never sets the `node` condition, so a declaration behind it leaves an importer untyped there.
		'{"type": "module", "exports": {"types": {"node": "./i.d.mts"}, "import": "./i.mjs"}}',
		// An earlier `import` branch that matches nothing without `browser` falls through, so an importer still reaches the `default`.
		'{"exports": {"types": {"require": "./types/i.d.cts"}, "import": {"browser": {"types": "./types/b.d.mts", "default": "./b.mjs"}}, "default": "./i.cjs"}}',
		// A string target ahead of `types` answers first, so TypeScript takes a declaration sitting next to that JavaScript over the `types` one.
		'{"type": "module", "exports": {"import": "./lib/index.js", "require": "./cjs/index.cjs", "types": "./lib/index.d.ts"}}',
		// A pattern is still checked when it names an extension.
		'{"exports": {".": {"types": "./dist/index.d.ts", "default": "./dist/index.js"}, "./types/*": {"types": "./types/*.js"}}}',
		// TypeScript looks for a declaration next to any target that is not TypeScript, not only JavaScript, so a JSON fallback does not type the JavaScript ahead of it. Checked with `tsc` in both modes.
		'{"types": "./a.d.ts", "exports": {"import": "./i.js", "default": "./data.json"}}',
		'{"exports": {"types": {"import": "./i.css"}, "import": "./i.js"}}',
		// TypeScript ignores `typesVersions` once `exports` is present, just like the top-level `types`. Checked with `tsc` in both modes.
		'{"typesVersions": {"*": {"*": ["types/*.d.ts"]}}, "exports": {".": "./dist/index.js"}}',
		// TypeScript looks past an array element that gives it no declaration, so the type conditions of the next element are checked too.
		'{"exports": [{"default": "./index.js"}, {"types": "./index.js"}]}',
		'{"exports": [{"default": "./i.js"}, {"default": "./i.js", "types": "./i.d.ts"}]}',
		// `nodenext` sets `node`, so a `node` target ahead of `types` answers first there.
		'{"exports": {"node": "./i.js", "types": "./i.d.ts", "default": "./i.js"}}',
	],
});
