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
const applySuggestion = code => {
	const [message] = lint(code, {'package-json/prefer-type-module': 'error'});
	const {fix} = message.suggestions[0];
	return code.slice(0, fix.range[0]) + fix.text + code.slice(fix.range[1]);
};

snapshotTest.snapshot({
	valid: [
		'{"type": "module"}',
		'{"name": "foo", "type": "module"}',
		// Malformed values are handled by validation rules.
		'{"type": true}',
		'{"type": 42}',
		'{"type": "esm"}',
	],
	invalid: [
		'{"name": "foo"}',
		// An empty root has no member to anchor the insertion on.
		'{}',
		'{\n}',
		`{
	"name": "foo"
}`,
		'{"type": "commonjs"}',
		// The added member goes where a sorted document holds it, after `version` and before `exports`.
		'{\n\t"name": "a",\n\t"version": "1.0.0",\n\t"exports": "./index.js",\n\t"scripts": {\n\t\t"test": "ava"\n\t}\n}',
		// A member on the opening line does not make the document one line.
		'{"name": "a",\n\t"exports": "./index.js"}',
	],
});

test('the added member lands where a sorted document holds it', () => {
	assert.equal(
		applySuggestion('{\n\t"name": "a",\n\t"version": "1.0.0",\n\t"exports": "./index.js",\n\t"scripts": {\n\t\t"test": "ava"\n\t}\n}'),
		'{\n\t"name": "a",\n\t"version": "1.0.0",\n\t"type": "module",\n\t"exports": "./index.js",\n\t"scripts": {\n\t\t"test": "ava"\n\t}\n}',
	);
	// With no field ranking before `type`, it goes first.
	assert.equal(applySuggestion('{"exports": "./index.js", "custom": true}'), '{"type": "module", "exports": "./index.js", "custom": true}');
	assert.equal(applySuggestion('{"name": "a",\n\t"exports": "./index.js"}'), '{"name": "a",\n\t"type": "module",\n\t"exports": "./index.js"}');
	// The member takes the indentation its siblings sit at, not the deepest one in the file.
	assert.equal(applySuggestion('{\n  "name": "a",\n  "files": [\n      "dist"\n  ]\n}'), '{\n  "name": "a",\n  "type": "module",\n  "files": [\n      "dist"\n  ]\n}');
});

test('the suggestion keeps a sorted document sorted', () => {
	const sortRules = {'package-json/sort-properties': 'error', 'package-json/sort-dependencies': 'error'};
	const inputs = [
		'{}',
		'{\n}',
		'{"name": "a"}',
		'{"name": "a", "version": "1.0.0", "exports": "./index.js", "scripts": {"test": "ava"}}',
		'{"exports": "./index.js", "files": ["dist"]}',
		'{"custom": true}',
		'{"name": "a", "name": "b", "exports": "./index.js"}',
		'{\n\t"name": "a",\n\t"version": "1.0.0",\n\t"exports": "./index.js",\n\t"scripts": {\n\t\t"test": "ava"\n\t}\n}',
		'{\n  "name": "a",\n  "files": [\n      "dist"\n  ]\n}',
		'{\n    "exports": "./index.js",\n    "custom": true\n}',
		'{\n\t"name": "a",\n\t"version": "1.0.0"\n}',
	];

	const isReported = code => lint(code, sortRules).length > 0;

	assert.deepEqual(inputs.filter(code => isReported(code)), []);
	// A document that does not parse is reported too, so this also proves every output is valid JSON.
	assert.deepEqual(inputs.map(code => applySuggestion(code)).filter(output => isReported(output)), []);
});
