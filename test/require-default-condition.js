import {getTester} from './utils/test.js';

const {test} = getTester(import.meta);

test.snapshot({
	valid: [
		// An empty object holds no conditions to complete.
		'{"exports": {}}',
		// Conditions object ending in `default`.
		`{
			"exports": {
				"import": "./index.js",
				"default": "./index.cjs"
			}
		}`,
		// Subpath map (not a conditions object).
		'{"exports": {".": "./index.js"}}',
		// Plain string `exports`.
		'{"exports": "./index.js"}',
		// Nested conditions all have `default`.
		`{
			"exports": {
				".": {
					"types": "./index.d.ts",
					"default": "./index.js"
				}
			}
		}`,
		// `imports` conditions object with `default`.
		`{
			"imports": {
				"#dep": {
					"node": "./node.js",
					"default": "./browser.js"
				}
			}
		}`,
		// `default` is already last in a nested conditions object.
		'{"exports": {".": {"import": "./index.mjs", "default": "./index.js"}}}',
		// Nested condition keys are not subpath keys.
		'{"imports": {"#dep": {"#custom": "./dep.js", "default": "./dep.js"}}}',
		// A malformed object that mixes a condition key with a subpath key is treated as a subpath map (key mixing is reported by `valid-fields`), so no missing-`default` report.
		`{
			"exports": {
				"import": "./index.js",
				"./sub": "./sub.js"
			}
		}`,
		// An array fallback of plain targets has no conditions object to check.
		`{
			"exports": {
				".": ["./index.js", "./fallback.js"]
			}
		}`,
		// A duplicated `default` resolves to its final entry, which is last, so the shadowed earlier one must not raise a false `defaultNotLast`.
		'{"exports": {"import": "./index.mjs", "default": "./old.cjs", "default": "./new.cjs"}}',
		'{"exports": {"default": "./a.js", "default": "./b.js"}}',
		// A nested conditions object that matches nothing resolves to nothing and Node moves on to the next sibling, so a `default` after it covers it. This is the nested-conditions example from the Node.js documentation.
		'{"exports": {"node": {"import": "./feature-node.mjs", "require": "./feature-node.cjs"}, "default": "./feature.mjs"}}',
		'{"imports": {"#dep": {"node": {"import": "./dep.mjs", "require": "./dep.cjs"}, "default": "./dep.js"}}}',
		'{"exports": {"node-addons": {"require": "./dep.cjs"}, "default": "./dep.js"}}',
		// A covered `node` branch that has a `default` of its own has nothing left to report.
		'{"exports": {"node": {"import": "./a.mjs", "require": "./a.cjs", "default": "./a.js"}, "default": "./a.js"}}',
		// A fallback list is the fallback: an element that matches no condition resolves to nothing and Node moves on to the next one, so every element but the last needs no `default` of its own.
		'{"exports": [{"import": "./a.mjs"}, {"require": "./a.cjs", "default": "./a.js"}]}',
		'{"exports": {".": [{"import": "./a.mjs"}, {"require": "./a.cjs", "default": "./a.js"}]}}',
		'{"exports": [[{"import": "./a.mjs"}], ["./b.js"]]}',
		'{"imports": {"#dep": [{"import": "./dep.mjs"}, {"require": "./dep.cjs", "default": "./dep.js"}]}}',
		// The fall-through does not depend on the enclosing condition: with `--conditions=development`, `require` resolves `./b.cjs`.
		'{"exports": {"development": {"import": "./a.mjs"}, "default": "./b.cjs"}}',
		'{"imports": {"#dep": {"browser": {"import": "./a.mjs"}, "default": "./b.js"}}}',
		// A match on nothing deeper down falls through every level, so the outer `default` covers the inner object too: an importer resolves `./a.js` here.
		'{"exports": {"node": {"require": {"types": "./a.d.cts", "require": "./a.cjs"}}, "default": "./a.js"}}',
	],
	invalid: [
		// A subpath map nested inside an array is still a subpath map, not a conditions object.
		'{"exports": [{".": {"a": 2, "require": 4}}]}',
		// Conditions object without `default`.
		`{
			"exports": {
				"types": "./index.d.ts",
				"import": "./index.js"
			}
		}`,
		// Nested conditions object without `default`.
		`{
			"exports": {
				".": {
					"types": "./index.d.ts",
					"import": "./index.js"
				}
			}
		}`,
		// `imports` conditions object without `default`.
		`{
			"imports": {
				"#dep": {
					"node": "./node.js"
				}
			}
		}`,
		// A condition key may start with the imports subpath prefix when nested.
		'{"imports": {"#dep": {"#custom": "./dep.js"}}}',
		// `default` must be last.
		'{"exports": {"default": "./index.js", "import": "./index.mjs"}}',
		'{"imports": {"#dep": {"default": "./dep.js", "node": "./node.js"}}}',
		// The effective `default` (the final duplicate) keeps its first appearance's position, so with a condition after it the report is genuine and points at the surviving node.
		'{"exports": {"default": "./a.js", "import": "./b.js", "default": "./c.js"}}',
		// With no `default` after it, a nested conditions object that matches nothing has nothing left to fall through to.
		'{"exports": {"development": {"import": "./dep.mjs", "require": "./dep.cjs"}}}',
		'{"exports": {"browser": {"import": "./dep.mjs", "require": "./dep.cjs"}}}',
		// A `default` before another condition is still wrong inside a fallback list.
		'{"exports": [{"default": "./a.js", "import": "./a.mjs"}, {"require": "./a.cjs"}]}',
		// The last element of a fallback list has nothing left to fall through to, so it needs a `default` of its own.
		'{"exports": [{"import": "./a.mjs"}, {"require": "./a.cjs", "types": "./a.d.cts"}]}',
		// A `default` before the nested object is read first, so nothing falls through to it.
		'{"exports": {"default": "./b.cjs", "development": {"import": "./a.mjs"}}}',
		// A subpath map is not a conditions object, so a sibling subpath does not cover a conditions object without a `default`.
		'{"exports": {".": {"import": "./a.mjs"}, "./b": "./b.js"}}',
	],
});
