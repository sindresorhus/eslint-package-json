import {getTester} from './utils/test.js';

const {test} = getTester(import.meta);

test.snapshot({
	valid: [
		// No `exports` field.
		'{"types": "./index.d.ts"}',
		// No type metadata means this rule has no type coverage contract to check.
		'{"exports": "./index.js"}',
		// A top-level declaration does not describe each exported branch, so add a type condition.
		'{"types": "./index.d.ts", "exports": {"types": "./index.d.ts", "default": "./index.js"}}',
		// The versioned TypeScript condition is also a type condition and must be first.
		'{"exports": {"types@>=5": "./index.d.mts", "default": "./index.mjs"}}',
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
		// A fallback condition can use a different nested runtime condition when its format matches.
		'{"type": "module", "exports": {"types": {"import": [], "default": {"node": "./fallback.d.mts"}}, "import": {"node": "./node.js"}}}',
		// Extra runtime condition layers must not force the declaration default before matching nested conditions.
		`{
	"type": "module",
	"exports": {
		"types": {"import": [], "default": {"browser": "./browser.d.mts", "default": "./fallback.d.cts"}},
		"import": {"node": {"browser": "./browser.mjs", "default": "./fallback.cjs"}}
	}
}`,
		// An unversioned nested type condition makes the default a non-type fallback.
		'{"type": "module", "exports": {"types": {"import": {"types@>=5": "./index.d.mts", "types": "./index.d.mts", "default": "./index.d.cts"}}, "import": {"import": "./index.mjs"}}}',
		// Non-empty declaration and runtime fallback arrays are covered.
		'{"exports": {"types": ["./index.d.ts", "./fallback.d.ts"], "default": ["./index.js", "./fallback.js"]}}',
		// Array validation stops after the first target.
		'{"type": "module", "exports": {"types": ["./index.d.mts", "./fallback.d.cts"], "default": ["./index.mjs", "./fallback.cjs"]}}',
		'{"exports": {"types": ["./index.d.ts", "./not-a-declaration.js"], "default": "./index.js"}}',
		// A nested versioned type condition can be the only type branch.
		'{"exports": {"types": {"import": {"types@>=5": "./import.d.ts"}}, "import": {"import": "./import.js"}}}',
		// An unresolved nested unversioned type condition can fall through to a compatible default.
		'{"type": "module", "exports": {"types": {"types": {"browser": "./browser.d.mts"}, "default": "./fallback.d.mts"}, "default": "./index.js"}}',
		// A parent fallback covers runtime branches omitted by a nested type condition.
		'{"type": "module", "exports": {"types": {"types": {"import": "./import.d.mts"}, "default": "./fallback.d.cts"}, "import": "./import.mjs", "require": "./require.cjs"}}',
		`{
	"type": "module",
	"exports": {
		"types": {
			"types@>=5": {"import": "./import.d.mts"},
			"types": {"import": "./fallback.d.mts", "require": "./fallback.d.cts"}
		},
		"import": "./import.mjs",
		"require": "./require.cjs"
	}
}`,
		// Nested declaration arrays also stop after the first target.
		'{"type": "module", "exports": {"types": {"import": ["./index.d.mts", "./unreachable.js"]}, "import": "./index.mjs"}}',
		// A non-runtime sibling does not invalidate a covered runtime branch.
		'{"exports": {"types": {"import": [], "default": {"node": "./node.d.ts"}}, "import": {"node": "./node.js", "browser": null}}}',
		// A null array target makes later runtime targets unreachable.
		'{"exports": {"types": "./index.d.ts", "default": [null, "./fallback.js"]}}',
		// A type condition in a later array target does not describe the effective export.
		'{"exports": [{"default": "./index.js"}, {"types": "./index.d.ts", "default": "./index.js"}]}',
		'{"exports": {"types": [{"default": "./fallback.d.ts"}, {"types": null}], "default": "./index.js"}}',
		// An empty type-target array falls through to the parent default.
		'{"exports": {"types": {"import": [], "default": "./fallback.d.ts"}, "import": "./import.js"}}',
		// A parent default can continue into a nested runtime condition.
		'{"exports": {"types": {"import": [], "default": {"import": "./fallback.d.ts"}}, "import": "./import.js"}}',
		// Each nested runtime branch has a matching declaration format.
		'{"type": "module", "exports": {"import": {"types": "./index.d.mts", "default": "./index.mjs"}, "require": {"types": "./index.d.cts", "default": "./index.cjs"}}}',
		'{"type": "commonjs", "exports": {"types": "./index.d.ts", "default": "./index.js"}}',
		'{"exports": {"types": {"import": "./import.d.ts", "require": "./require.d.ts"}, "import": "./import.js", "require": "./require.js"}}',
		'{"type": "module", "exports": {"types": {"import": "./import.d.mts", "require": "./require.d.cts"}, "import": "./import.mjs", "require": "./require.cjs"}}',
		'{"exports": {"types": {"import": "./import.d.mts", "default": "./fallback.d.ts"}, "import": "./import.mjs", "require": "./require.cjs"}}',
		// A `.d.ts` declaration follows the package module type.
		'{"type": "module", "exports": {"types": "./index.d.ts", "default": "./index.js"}}',
		// A nested type condition covers every runtime branch in that conditions object.
		'{"exports": {".": {"types": "./index.d.ts", "import": "./index.js", "default": "./index.cjs"}}}',
		// A declaration string covers every runtime leaf below its branch.
		'{"exports": {"types": "./index.d.ts", "default": {"node": "./index.js", "browser": "./browser.js"}}}',
		// Non-JavaScript export targets do not need declaration coverage.
		'{"exports": {"types": "./index.d.ts", "default": "./package.json"}}',
	],
	invalid: [
		// A top-level declaration does not cover an exported runtime branch.
		'{"types": "./index.d.ts", "exports": "./index.js"}',
		'{"typings": "./index.d.ts", "exports": {".": "./index.js"}}',
		// Type conditions must come before runtime conditions, including versioned ones.
		'{"exports": {"default": "./index.js", "types": "./index.d.ts"}}',
		'{"exports": {"default": "./index.mjs", "types@>=5": "./index.d.mts"}}',
		'{"exports": {"types@>=5": "./index.d.ts", "default": "./index.js", "types@>=4": "./index.d.ts"}}',
		'{"exports": {"import": {"default": "./index.js", "types": "./index.d.ts"}}}',
		// Type conditions must point to declaration files.
		'{"exports": {"types": "./index.js", "default": "./index.js"}}',
		'{"exports": {"types": "./index.ts", "default": "./index.mjs"}}',
		'{"exports": {"types": null, "default": "./index.js"}}',
		'{"exports": {"types": true, "default": "./index.js"}}',
		'{"exports": {"types": false, "default": "./index.js"}}',
		'{"exports": {"types": "", "default": "./index.js"}}',
		'{"exports": {"types": ["", "./index.d.ts"], "default": "./index.js"}}',
		'{"exports": {"types": {"import": "./index.d.ts", "browser": "./not-a-declaration.js"}, "import": "./index.js"}}',
		// Nested type conditions receive the same ordering and value validation.
		'{"exports": {"types": {"default": "./legacy.d.ts", "types@>=5": "./modern.d.ts"}, "default": "./index.js"}}',
		'{"exports": {"types": {"types": null, "default": "./fallback.d.ts"}, "default": "./index.js"}}',
		// A null array target terminates resolution before later declaration targets.
		'{"exports": {"types": [null, "./index.d.ts"], "default": ["./index.js", "./fallback.js"]}}',
		// A null nested array target does not fall through to a sibling declaration default.
		'{"exports": {"types": {"import": [null, "./index.d.ts"], "default": "./fallback.d.ts"}, "import": "./index.js"}}',
		// A null nested array target also prevents module-format checks against its sibling fallback.
		'{"type": "module", "exports": {"types": {"import": [null, "./index.d.mts"], "default": "./fallback.d.cts"}, "import": "./index.js"}}',
		// A nested default null target does not fall through to its parent declaration fallback.
		'{"exports": {"types": {"import": {"default": null}, "default": "./fallback.d.ts"}, "import": "./index.js"}}',
		// An inactive nested condition does not provide coverage when its default is null.
		'{"exports": {"types": {"import": {"browser": "./browser.d.ts", "default": null}, "default": "./fallback.d.ts"}, "import": {"node": "./index.js"}}}',
		'{"exports": {"types": {"import": {"browser": "./browser.d.ts", "default": null}, "default": "./fallback.d.ts"}, "import": "./index.js"}}',
		// An active named null target does not fall through to its parent declaration fallback.
		'{"exports": {"types": {"import": {"node": null}, "default": "./fallback.d.ts"}, "import": {"node": "./index.js"}}}',
		// Its unreachable parent fallback must not participate in module-format validation either.
		'{"type": "module", "exports": {"types": {"import": {"node": null}, "default": "./fallback.d.cts"}, "import": {"node": "./index.mjs"}}}',
		// Declaration module format must match the runtime target.
		'{"type": "module", "exports": {"types": "./index.d.cts", "default": "./index.mjs"}}',
		// One declaration paired with multiple runtime targets of the same format produces one diagnostic.
		'{"type": "module", "exports": {"types": "./index.d.cts", "default": {"node": "./node.js", "browser": "./browser.js"}}}',
		// Distinct declaration nodes receive separate diagnostics even when their paths match.
		'{"type": "module", "exports": {"types@>=5": "./index.d.cts", "types": "./index.d.cts", "default": "./index.mjs"}}',
		'{"type": "commonjs", "exports": {"types": "./index.d.mts", "default": "./index.cjs"}}',
		'{"exports": {"types": "./index.d.ts", "default": "./index.mjs"}}',
		// Every exported branch needs its own type condition.
		'{"types": "./index.d.ts", "exports": [{"default": "./index.js"}, {"types": "./index.d.ts"}]}',
		'{"types": "./index.d.ts", "exports": {"import": {"types": "./index.d.mts", "default": "./index.mjs"}, "require": "./index.cjs"}}',
		'{"exports": {"import": {"types": "./index.d.mts", "default": "./index.mjs"}, "require": {"default": "./index.cjs"}}}',
		'{"exports": {"types": {"import": "./import.d.ts"}, "import": "./import.js", "require": "./require.js"}}',
		'{"type": "module", "exports": {"types": {"import": "./import.d.cts", "require": "./require.d.cts"}, "import": "./import.mjs", "require": "./require.cjs"}}',
		`{
	"exports": {
		"types@>=5.2": {"import": "./import.d.ts"},
		"types@>=4.7": {"require": "./require.d.ts"},
		"import": "./import.js",
		"require": "./require.js"
	}
}`,
		// Format mismatches must also be checked when a nested type condition falls through to a parent default.
		'{"type": "module", "exports": {"types": {"import": {"browser": "./browser.d.mts"}, "default": "./fallback.d.cts"}, "import": {"browser": "./browser.mjs", "node": "./node.js"}}}',
		// A nested type default must be paired with a string runtime target.
		'{"type": "module", "exports": {"types": {"import": {"default": "./index.d.cts"}}, "import": "./index.js"}}',
		// An empty type-target array must also fall through for module-format checks.
		'{"type": "module", "exports": {"types": {"import": [], "default": "./fallback.d.cts"}, "import": "./import.js"}}',
		// Nested fallback conditions must also be checked for module-format mismatches.
		'{"type": "module", "exports": {"types": {"import": [], "default": {"import": "./fallback.d.cts"}}, "import": "./import.js"}}',
		// A fallback condition can continue with a different nested runtime condition.
		'{"type": "module", "exports": {"types": {"import": [], "default": {"node": "./fallback.d.cts"}}, "import": {"node": "./node.js"}}}',
		// Versioned nested type conditions must also check their declaration fallback.
		'{"type": "module", "exports": {"types": {"types@>=5": [], "types": {"import": "./import.d.mts", "require": "./require.d.cts"}}, "import": "./import.mjs", "require": "./require.cjs"}}',
		'{"type": "module", "exports": {"types": {"import": {"types@>=5": "./index.d.mts", "default": "./index.d.cts"}}, "import": {"import": "./index.mjs"}}}',
		'{"type": "module", "exports": {"types": {"import": [], "default": {"types@>=5": "./modern.d.mts", "default": "./legacy.d.cts"}}, "import": "./index.mjs"}}',
		// An unresolved nested unversioned type condition must check its declaration fallback.
		'{"type": "module", "exports": {"types": {"types": {"browser": "./browser.d.mts"}, "default": "./fallback.d.cts"}, "default": "./index.js"}}',
		// Partial type coverage should only report the uncovered sibling.
		'{"exports": {"types": {"import": {"node": "./node.d.ts"}}, "import": {"node": "./node.js", "browser": "./browser.js"}}}',
		'{"exports": {"types@>=5": {"import": {"node": "./node.d.ts"}}, "import": {"node": "./node.js", "browser": "./browser.js"}}}',
		// Nested fallback conditions must retain their parent runtime condition.
		'{"type": "module", "exports": {"types": {"import": [], "default": {"import": {"node": "./fallback.d.cts"}}}, "import": {"node": "./node.js"}}}',
		// Fallback conditions can continue through an empty nested target.
		'{"type": "module", "exports": {"types": {"import": [], "default": {"import": [], "default": "./fallback.d.cts"}}, "import": {"node": "./node.js"}}}',
	],
});
