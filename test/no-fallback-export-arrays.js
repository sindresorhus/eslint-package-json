import {getTester} from './utils/test.js';

const {test} = getTester(import.meta);

test.snapshot({
	valid: [
		'{"name": "foo"}',
		'{"exports": "./index.js"}',
		'{"exports": {".": ["./index.js"]}}',
		'{"imports": ["./a.js", "./b.js"]}',
		'{"exports": ["not:valid", "./submodule.js"]}',
		'{"exports": ["./a/../invalid.js", "./fallback.js"]}',
		'{"exports": ["./node_modules/invalid.js", "./fallback.js"]}',
		'{"exports": ["./a%2Finvalid.js", "./fallback.js"]}',
		'{"imports": {"#dep": ["../invalid.js", "./dep.js"]}}',
		'{"imports": {"#dep": ["/invalid.js", "./dep.js"]}}',
		'{"imports": {"#dep": ["node:fs", "./dep.js"]}}',
		'{"exports": {".": [{"development": "./development.js"}, "./index.js"]}}',
		'{"imports": {"#dep": [{"development": "./development.js"}, "./dep.js"]}}',
		'{"exports": {".": ["./index.js", null]}}',
		'{"exports": {".": ["./a.js", "./b.js", null]}}',
		'{"imports": {"#dep": ["./dep.js", {"development": "./development.js"}]}}',
		'{"imports": {"#dep": ["./a.js", {"development": "./development.js"}, "./b.js"]}}',
	],
	invalid: [
		'{"exports": {".": ["./a.js", "./b.js"]}}',
		'{"imports": {"#dep": ["./a.js", "./b.js"]}}',
		'{"imports": {"#dep": ["missing-package", "./dep.js"]}}',
		`{
	"exports": {
		".": {
			"import": ["./import.js", "./fallback.js"]
		}
	}
}`,
		`{
	"exports": [
		"./a.js",
		"./b.js"
	]
}`,
		`{
	"imports": {
		"#dep": [
			["./a.js", "./b.js"]
		]
	}
}`,
	],
});
