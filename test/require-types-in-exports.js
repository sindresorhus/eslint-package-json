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
		// Each nested runtime branch has a matching declaration format.
		'{"type": "module", "exports": {"import": {"types": "./index.d.mts", "default": "./index.mjs"}, "require": {"types": "./index.d.cts", "default": "./index.cjs"}}}',
		'{"type": "commonjs", "exports": {"types": "./index.d.ts", "default": "./index.js"}}',
		// A `.d.ts` declaration follows the package module type.
		'{"type": "module", "exports": {"types": "./index.d.ts", "default": "./index.js"}}',
		// A nested type condition covers every runtime branch in that conditions object.
		'{"exports": {".": {"types": "./index.d.ts", "import": "./index.js", "default": "./index.cjs"}}}',
	],
	invalid: [
		// A top-level declaration does not cover an exported runtime branch.
		'{"types": "./index.d.ts", "exports": "./index.js"}',
		'{"typings": "./index.d.ts", "exports": {".": "./index.js"}}',
		// Type conditions must come before runtime conditions, including versioned ones.
		'{"exports": {"default": "./index.js", "types": "./index.d.ts"}}',
		'{"exports": {"default": "./index.mjs", "types@>=5": "./index.d.mts"}}',
		// Type conditions must point to declaration files.
		'{"exports": {"types": "./index.js", "default": "./index.js"}}',
		'{"exports": {"types": "./index.ts", "default": "./index.mjs"}}',
		'{"exports": {"types": null, "default": "./index.js"}}',
		'{"exports": {"types": true, "default": "./index.js"}}',
		'{"exports": {"types": "", "default": "./index.js"}}',
		'{"exports": {"types": ["", "./index.d.ts"], "default": "./index.js"}}',
		// Declaration module format must match the runtime target.
		'{"type": "module", "exports": {"types": "./index.d.cts", "default": "./index.mjs"}}',
		'{"type": "commonjs", "exports": {"types": "./index.d.mts", "default": "./index.cjs"}}',
		'{"exports": {"types": "./index.d.ts", "default": "./index.mjs"}}',
		// Every exported branch needs its own type condition.
		'{"types": "./index.d.ts", "exports": {"import": {"types": "./index.d.mts", "default": "./index.mjs"}, "require": "./index.cjs"}}',
		'{"exports": {"import": {"types": "./index.d.mts", "default": "./index.mjs"}, "require": {"default": "./index.cjs"}}}',
	],
});
