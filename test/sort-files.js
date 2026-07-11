import {getTester} from './utils/test.js';

const {test} = getTester(import.meta);

test.snapshot({
	valid: [
		// No files field.
		'{"name": "foo"}',
		// Invalid files fields are handled by valid-fields.
		'{"files": "dist"}',
		'{"files": ["dist", 1]}',
		'{"files": ["z", ""]}',
		// Empty and singleton arrays need no ordering.
		'{"files": []}',
		'{"files": ["dist"]}',
		// Runtime files precede declaration companions, followed by a directory.
		'{"files": ["index.js", "index.d.ts", "rules"]}',
		// Extensionless runtime paths precede declaration companions too.
		'{"files": ["bin/cli", "bin/cli.d.ts"]}',
		// Exact entry-point targets take priority over other entries.
		'{"exports": {"types": "./index.d.ts", "default": "./index.js"}, "bin": "./cli.js", "files": ["index.js", "index.d.ts", "cli.js", "assets"]}',
		// Bare directories and positive glob patterns use the same path ordering.
		'{"files": ["dist", "dist/*.js", "dist/*.d.ts", "src/**/*.js", "src/**/*.d.ts"]}',
		// Repeated exports targets retain their first appearance in the exports tree.
		`{
	"exports": {
		".": {
			"node": {
				"types": "./node.d.ts",
				"import": "./node.js"
			},
			"default": {
				"types": "./default.d.ts",
				"import": "./default.js"
			}
		},
		"./node": "./node.js"
	},
	"files": ["node.js", "node.d.ts", "default.js", "default.d.ts"]
}`,
		// Negations are intentionally ignored because their order has npm semantics.
		'{"files": ["dist", "!dist/**/*.test.js", "dist/index.js"]}',
	],
	invalid: [
		// Entry-point targets sort before unrelated paths and declarations follow runtime files.
		'{"exports": {"types": "./index.d.ts", "default": "./index.js"}, "bin": "./cli.js", "files": ["assets", "cli.js", "index.d.ts", "index.js"]}',
		// Legacy entry-point fields and a bin object are supported too.
		'{"main": "./index.js", "types": "./index.d.ts", "bin": {"cli": "./cli.js"}, "files": ["assets", "cli.js", "index.d.ts", "index.js"]}',
		// Runtime and declaration globs are paired.
		'{"files": ["src/**/*.d.ts", "src/**/*.js"]}',
		// Extensionless runtime paths and declarations are paired too.
		'{"files": ["bin/cli.d.ts", "bin/cli"]}',
		// The first export target wins when a subpath repeats it.
		`{
	"exports": {
		".": {
			"node": {
				"types": "./node.d.ts",
				"import": "./node.js"
			},
			"default": {
				"types": "./default.d.ts",
				"import": "./default.js"
			}
		},
		"./node": "./node.js"
	},
	"files": ["default.js", "default.d.ts", "node.js", "node.d.ts"]
}`,
		// Multiline input preserves tab indentation.
		`{
	"files": [
		"index.d.ts",
		"index.js",
		"rules"
	]
}`,
		// Multiline input preserves 2-space indentation.
		`{
  "files": [
    "src/**/*.d.ts",
    "src/**/*.js"
  ]
}`,
		// CRLF line endings are preserved.
		'{\r\n\t"files": [\r\n\t\t"index.d.ts",\r\n\t\t"index.js"\r\n\t]\r\n}',
	],
});
