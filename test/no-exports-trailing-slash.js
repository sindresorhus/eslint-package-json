import {getTester} from './utils/test.js';

const {test} = getTester(import.meta);

test.snapshot({
	valid: [
		'{"exports": {"./foo/*": "./dist/foo/*"}}',
		'{"exports": {".": "./index.js"}}',
		'{"exports": "./index.js"}',
		'{"imports": {"#internal/*": "./src/internal/*.js"}}',
		'{"name": "foo"}',
		// A target that is not a relative path is not a folder here at all; `valid-fields` reports it.
		'{"imports": {"#dep": "lodash/"}}',
		'{"exports": {".": "../x/"}}',
	],
	invalid: [
		'{"exports": {"./foo/": "./dist/foo/"}}',
		'{"exports": {"./foo/": "./dist/*/"}}',
		'{"exports": {"./foo/*/": "./dist/foo/"}}',
		'{"exports": {"./foo/*/": ["./dist/foo/"]}}',
		'{"exports": {".": "./lib/"}}',
		`{
			"exports": {
				".": {
					"import": "./dist/"
				}
			}
		}`,
		'{"imports": {"#internal/": "./src/internal/"}}',
		// Bare string `exports` with a trailing slash.
		'{"exports": "./dist/"}',
		// Trailing slash only on the value, with a valid (non-slash) key.
		'{"imports": {"#dep": "./src/"}}',
		// Trailing slash inside an array fallback.
		'{"exports": {".": ["./dist/", "./other.js"]}}',
		// A folder mapping whose target is a single file cannot become a pattern, because a pattern would
		// map every subpath onto that one file. The report is the whole answer there.
		'{"exports": {"./foo/": "./dist/foo/index.js"}}',
		'{"exports": {"./a/": "./dist/a/index.js", "./b/": "./dist/b/index.js"}}',
		// An `imports` folder mapping is reported with its own `#` prefix in the suggested pattern.
		'{"imports": {"#a/": "./a.js"}}',
		'{"imports": {"#a/": "./dist/a/"}}',
		// The suggested pattern is already a sibling, so rewriting the key onto it would leave a duplicate
		// member that `JSON.parse` resolves to the wrong target. The mapping is reported without a suggestion,
		// since merging the two patterns is the author's call.
		'{"exports": {"./lib/*": "./other/*", "./lib/": "./dist/lib/"}}',
		'{"exports": {"./lib/": "./dist/lib/", "./lib/*": "./other/*"}}',
		'{"imports": {"#a/*": "./other/*", "#a/": "./dist/a/"}}',
		// A mapping that cannot become a pattern at all is not a collision: the report is the same one every other
		// unusable mapping gets, and the author merges by hand either way.
		'{"exports": {"./foo/*/": "./dist/foo/"}}',
		'{"exports": {"./a/": "./dist/*/"}}',
		// A sibling holding the same key is rewritten onto the same new key, which leaves the same duplicate
		// member. Nothing is taken by it, so the report stays the plain one and there is no suggestion either.
		'{"exports": {"./a/": "./x/", "./a/": "./y/"}}',
		'{"exports": {"./a/": "./x/", "./a/": "./y/*"}}',
		// The key beside the target cannot become a pattern, so the target cannot either: rewriting it alone
		// leaves a mapping npm still cannot resolve.
		'{"exports": {"./a/": ["./b/"]}}',
		'{"exports": {"./a/": {"x": "./b/"}}}',
		// The pattern takes `./foo/x.js` from `./*`, which answered it while the folder mapping was ignored, so the conversion is a suggestion that rewrites the key and the target together.
		'{"exports": {"./foo/": "./lib/foo/", "./*": "./dist/*"}}',
		`{
	"exports": {
		"./foo/": "./dist/foo/",
		"./bar/": "./dist/bar/index.js"
	}
}`,
		// Only one half has the trailing slash, so there is no folder mapping to convert and the report stands alone.
		'{"exports": {"./foo/*": "./dist/foo/"}}',
		'{"exports": {"./foo/": "./dist/foo/*"}}',
		// Subpath keys only exist at the top level. Node.js reads a `./foo/` key inside a conditions object as a condition name, so a pattern there would not resolve either, and there is no suggestion.
		'{"exports": {"import": {"./foo/": "./dist/foo/"}}}',
	],
});
