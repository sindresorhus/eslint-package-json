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
	],
});
