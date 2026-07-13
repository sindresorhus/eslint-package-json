import {getTester} from './utils/test.js';

const {test} = getTester(import.meta);

test.snapshot({
	valid: [
		'{"name": "foo"}',
		'{"exports": "./index.js"}',
		'{"exports": {".": ["./index.js"]}}',
		'{"exports": {".": [{"development": "./development.js"}, "./index.js"]}}',
		'{"imports": {"#dep": [{"development": "./development.js"}, "./dep.js"]}}',
		'{"exports": {".": ["./index.js", null]}}',
		'{"imports": {"#dep": ["./dep.js", {"development": "./development.js"}]}}',
	],
	invalid: [
		'{"exports": {".": ["./a.js", "./b.js"]}}',
		'{"imports": {"#dep": ["./a.js", "./b.js"]}}',
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
