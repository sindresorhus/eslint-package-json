import test from 'node:test';
import assert from 'node:assert/strict';
import {Linter} from 'eslint';
import json from '@eslint/json';
import plugin from '../index.js';
import {getTester} from './utils/test.js';

const {test: snapshotTest} = getTester(import.meta);
const linter = new Linter();
const lint = (code, rules) => linter.verify(code, [{
	files: ['**'],
	language: 'json/json',
	plugins: {json, 'package-json': plugin},
	rules,
}], {filename: 'package.json'});
const applySuggestions = code => {
	const [message] = lint(code, {'package-json/prefer-side-effects-field': 'error'});
	return message.suggestions.map(({fix}) => code.slice(0, fix.range[0]) + fix.text + code.slice(fix.range[1]));
};

snapshotTest.snapshot({
	valid: [
		// No `exports` field.
		'{"name": "foo"}',
		'{"main": "./index.js", "module": "./index.mjs", "browser": "./browser.js"}',
		'{"imports": {"#feature": {"default": "./feature.js"}}}',
		// An existing field is out of scope, regardless of its value.
		'{"exports": "./index.js", "sideEffects": false}',
		'{"exports": {"default": "./index.js"}, "sideEffects": true}',
		'{"exports": {"./feature": "./feature.js"}, "sideEffects": ["*.css"]}',
		'{"exports": "./index.js", "sideEffects": "false"}',
	],
	invalid: [
		// Common `exports` forms.
		'{"exports": "./index.js"}',
		`{
  "name": "my-package",
  "exports": {
    "default": "./index.js"
  },
  "engines": {"node": ">=18"}
}`,
		'{"exports": {"./feature": "./feature.js"}}',
		'{"exports": ["./index.js", "./fallback.js"]}',
		'{"exports": "./index.js", "custom": true}',
		// An unknown field before `exports` must not pull the added `sideEffects` in front of `exports`.
		'{"custom": "x", "exports": "./index.js"}',
		// Private packages can still be bundled from a workspace.
		'{"private": true, "exports": "./index.js"}',
		// A field that canonically follows `sideEffects` but is written ahead of `exports` must not pull the
		// added `sideEffects` in front of `exports` either.
		'{"engines": {"node": ">=18"}, "exports": "./index.js"}',
		`{
  "engines": {"node": ">=18"},
  "exports": "./index.js",
  "files": ["dist"]
}`,
		// The added member is a sibling of the one it follows, so it takes that member's own indentation. The
		// deepest increase in the file is not the level these members sit at.
		`{
  "name": "a",
  "exports": {
        "./x": "./x.js",
        "./y": "./y.js"
  }
}`,
		`{
"name": "a",
"exports": {
"./x": "./x.js"
}
}`,
	],
});

test('the suggestions keep a sorted document sorted', () => {
	const sortRules = {'package-json/sort-properties': 'error', 'package-json/sort-dependencies': 'error'};
	const inputs = [
		'{"exports": "./index.js"}',
		'{"name": "a", "exports": "./index.js", "engines": {"node": ">=20"}}',
		'{"name": "a", "exports": "./index.js", "custom": true}',
		'{"exports": "./index.js", "exports": "./main.js", "files": ["dist"]}',
		'{"name": "a",\n\t"exports": "./index.js"}',
		'{\n\t"name": "a",\n\t"exports": "./index.js",\n\t"scripts": {\n\t\t"test": "ava"\n\t}\n}',
		'{\n  "name": "a",\n  "exports": {\n      "default": "./index.js"\n  }\n}',
		'{\n    "exports": "./index.js",\n    "engines": {\n        "node": ">=20"\n    }\n}',
	];

	const isReported = code => lint(code, sortRules).length > 0;

	assert.deepEqual(inputs.filter(code => isReported(code)), []);
	// A document that does not parse is reported too, so this also proves every output is valid JSON.
	assert.deepEqual(inputs.flatMap(code => applySuggestions(code)).filter(output => isReported(output)), []);

	// A member on the opening line does not make the document one line.
	assert.equal(applySuggestions('{"name": "a",\n\t"exports": "./index.js"}')[0], '{"name": "a",\n\t"exports": "./index.js",\n\t"sideEffects": false}');

	// A compact root whose only member spans lines is still one line, so the added member stays on the closing line of `exports`.
	assert.equal(applySuggestions('{"exports": {\n\t"default": "./a.js"\n}}')[0], '{"exports": {\n\t"default": "./a.js"\n}, "sideEffects": false}');
});
