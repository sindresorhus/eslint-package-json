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
	const [message] = lint(code, {'package-json/peer-dependencies-as-dev-dependencies': 'error'});
	const {fix} = message.suggestions[0];
	return code.slice(0, fix.range[0]) + fix.text + code.slice(fix.range[1]);
};

snapshotTest.snapshot({
	valid: [
		// Peer dep also in devDependencies.
		'{"peerDependencies": {"foo": "^1.0.0"}, "devDependencies": {"foo": "^1.0.0"}}',
		// Multiple peer deps all in devDependencies.
		'{"peerDependencies": {"foo": "^1.0.0", "bar": "^2.0.0"}, "devDependencies": {"foo": "^1.0.0", "bar": "^2.0.0"}}',
		// No peerDependencies field.
		'{"dependencies": {"foo": "^1.0.0"}}',
		// Empty peerDependencies.
		'{"peerDependencies": {}}',
		// No devDependencies but also no peerDependencies.
		'{"name": "my-package"}',
		// PeerDependencies value is not an object (edge case).
		'{"peerDependencies": "invalid"}',
		// Dev version differs but still satisfies the peer range.
		'{"peerDependencies": {"foo": "^1.0.0"}, "devDependencies": {"foo": "1.5.0"}}',
		// Non-range dev specifier is skipped.
		'{"peerDependencies": {"foo": "^1.0.0"}, "devDependencies": {"foo": "workspace:*"}}',
		// A non-string peer value present in devDependencies is skipped.
		'{"peerDependencies": {"foo": 1}, "devDependencies": {"foo": "^1.0.0"}}',
		// A non-string peer value missing from devDependencies is malformed and skipped (reported by `valid-fields`).
		'{"peerDependencies": {"foo": 1}}',
		// A non-string devDependencies range is malformed, so the overlap check is skipped rather than crashing.
		'{"peerDependencies": {"foo": "^1.0.0"}, "devDependencies": {"foo": 123}}',
		// An optional peer is exempt from the missing-devDependencies check.
		'{"peerDependencies": {"foo": "^1.0.0"}, "peerDependenciesMeta": {"foo": {"optional": true}}}',
		// A duplicated peer key resolves to its final range, which matches the devDependency; the shadowed earlier range must not raise a spurious mismatch.
		'{"peerDependencies": {"foo": "^1.0.0", "foo": "^2.0.0"}, "devDependencies": {"foo": "^2.0.0"}}',
	],
	invalid: [
		// A non-object `peerDependenciesMeta` entry must not break the optional-peer lookup.
		'{"peerDependencies": {"a": "^1.0.0"}, "peerDependenciesMeta": {"a": []}}',
		'{"peerDependencies": {"a": "^1.0.0"}, "peerDependenciesMeta": {"a": "x"}}',
		'{"peerDependencies": {"a": "^1.0.0"}, "peerDependenciesMeta": {"a": null}}',
		// Peer dep not in devDependencies.
		'{"peerDependencies": {"foo": "^1.0.0"}}',
		// Peer dep not in devDependencies (devDependencies exists but doesn't have it).
		'{"peerDependencies": {"foo": "^1.0.0"}, "devDependencies": {"bar": "^2.0.0"}}',
		// Multiple peer deps, none in devDependencies.
		'{"peerDependencies": {"foo": "^1.0.0", "bar": "^2.0.0"}}',
		// Multiple peer deps, only some in devDependencies.
		'{"peerDependencies": {"foo": "^1.0.0", "bar": "^2.0.0"}, "devDependencies": {"foo": "^1.0.0"}}',
		// No devDependencies at all.
		'{"peerDependencies": {"react": "^18.0.0"}}',
		// Empty devDependencies object: the added entry fills it.
		'{"peerDependencies": {"foo": "^1.0.0"}, "devDependencies": {}}',
		// Multiline input: the added entry preserves the file's indentation.
		`{
	"peerDependencies": {
		"foo": "^1.0.0"
	},
	"devDependencies": {
		"bar": "^2.0.0"
	}
}`,
		// Dev version does not satisfy the peer range.
		'{"peerDependencies": {"react": "^18.0.0"}, "devDependencies": {"react": "^17.0.0"}}',
		// A malformed (non-object) `devDependencies` is left to `valid-fields`; no fix is offered.
		'{"peerDependencies": {"foo": "^1.0.0"}, "devDependencies": "invalid"}',
		// `optional: false` is not exempt from the missing-devDependencies check.
		'{"peerDependencies": {"foo": "^1.0.0"}, "peerDependenciesMeta": {"foo": {"optional": false}}}',
		// A duplicated meta key resolves to its final entry: the effective `optional: false` makes the peer required, so a shadowed `optional: true` must not exempt it.
		'{"peerDependencies": {"foo": "^1.0.0"}, "peerDependenciesMeta": {"foo": {"optional": true}, "foo": {"optional": false}}}',
		// An optional peer that is in devDependencies still has its range checked against the peer range.
		'{"peerDependencies": {"react": "^18.0.0"}, "peerDependenciesMeta": {"react": {"optional": true}}, "devDependencies": {"react": "^17.0.0"}}',
		// An existing but empty group written on one line stays on one line, the way a non-empty one does.
		'{"peerDependencies": {"a": "^1.0.0"}, "devDependencies": {}, "name": "x"}',
		// A `devDependencies` group that has to be created goes on one line when the root is on one line.
		'{"name": "x", "version": "1.0.0", "peerDependencies": {"a": "^1.0.0"}}',
		// An empty group written across lines keeps the closing indent the author wrote, so the entry goes in
		// front of it rather than after it.
		`{
	"peerDependencies": {
		"a": "^1.0.0"
	},
	"devDependencies": {
	}
}`,
		`{
	"peerDependencies": {
		"a": "^1.0.0"
	},
	"devDependencies": {

	}
}`,
		// The created group goes where a sorted document holds it, before `peerDependencies`.
		'{"name": "a", "peerDependencies": {"react": "^18.0.0"}}',
		'{\n  "name": "a",\n  "peerDependencies": {\n      "react": "^18.0.0"\n  }\n}',
		// The added entry goes where a sorted group holds it.
		'{"devDependencies": {"ava": "1", "xo": "1"}, "peerDependencies": {"react": "^18.0.0"}}',
		'{\n\t"devDependencies": {\n\t\t"ava": "1",\n\t\t"xo": "1"\n\t},\n\t"peerDependencies": {\n\t\t"react": "^18.0.0"\n\t}\n}',
	],
});

test('the added entry lands where a sorted document holds it', () => {
	assert.equal(applySuggestion('{"name": "a", "peerDependencies": {"react": "^18.0.0"}}'), '{"name": "a", "devDependencies": {"react": "^18.0.0"}, "peerDependencies": {"react": "^18.0.0"}}');
	assert.equal(
		applySuggestion('{"devDependencies": {"ava": "1", "xo": "1"}, "peerDependencies": {"react": "^18.0.0"}}'),
		'{"devDependencies": {"ava": "1", "react": "^18.0.0", "xo": "1"}, "peerDependencies": {"react": "^18.0.0"}}',
	);
	assert.equal(applySuggestion('{"devDependencies": {"ava": "1"}, "peerDependencies": {"xo": "1"}}'), '{"devDependencies": {"ava": "1", "xo": "1"}, "peerDependencies": {"xo": "1"}}');
	assert.equal(applySuggestion('{"devDependencies": {"xo": "1"}, "peerDependencies": {"ava": "1"}}'), '{"devDependencies": {"ava": "1", "xo": "1"}, "peerDependencies": {"ava": "1"}}');
	// A new group nests its entry one root level deeper, since the root's own indentation is the only level the document fixes.
	assert.equal(
		applySuggestion('{\n  "name": "a",\n  "peerDependencies": {\n      "react": "^18.0.0"\n  }\n}'),
		'{\n  "name": "a",\n  "devDependencies": {\n    "react": "^18.0.0"\n  },\n  "peerDependencies": {\n      "react": "^18.0.0"\n  }\n}',
	);
	assert.equal(
		applySuggestion('{\n\t"devDependencies": {\n\t\t"ava": "1",\n\t\t"xo": "1"\n\t},\n\t"peerDependencies": {\n\t\t"react": "^18.0.0"\n\t}\n}'),
		'{\n\t"devDependencies": {\n\t\t"ava": "1",\n\t\t"react": "^18.0.0",\n\t\t"xo": "1"\n\t},\n\t"peerDependencies": {\n\t\t"react": "^18.0.0"\n\t}\n}',
	);
});

test('the suggestion keeps a sorted document sorted', () => {
	const sortRules = {'package-json/sort-properties': 'error', 'package-json/sort-dependencies': 'error'};
	const inputs = [
		'{"peerDependencies": {"react": "^18.0.0"}}',
		'{"name": "a", "peerDependencies": {"react": "^18.0.0"}}',
		'{"name": "a", "peerDependencies": {"react": "^18.0.0"}, "custom": true}',
		'{"name": "a", "dependencies": {"b": "1"}, "peerDependencies": {"react": "^18.0.0"}}',
		'{"name": "a", "name": "b", "peerDependencies": {"react": "^18.0.0"}}',
		'{"devDependencies": {}, "peerDependencies": {"react": "^18.0.0"}}',
		'{"devDependencies": {"ava": "1", "xo": "1"}, "peerDependencies": {"react": "^18.0.0"}}',
		'{"devDependencies": {"ava": "1"}, "peerDependencies": {"xo": "1"}}',
		'{"devDependencies": {"xo": "1"}, "peerDependencies": {"ava": "1"}}',
		'{"devDependencies": {"ava": "1", "ava": "2", "xo": "1"}, "peerDependencies": {"react": "^18.0.0"}}',
		'{\n  "name": "a",\n  "peerDependencies": {\n      "react": "^18.0.0"\n  }\n}',
		'{\n\t"devDependencies": {\n\t\t"ava": "1",\n\t\t"xo": "1"\n\t},\n\t"peerDependencies": {\n\t\t"react": "^18.0.0"\n\t}\n}',
		'{\n    "devDependencies": {\n    },\n    "peerDependencies": {\n        "react": "^18.0.0"\n    }\n}',
	];

	const isReported = code => lint(code, sortRules).length > 0;

	assert.deepEqual(inputs.filter(code => isReported(code)), []);
	// A document that does not parse is reported too, so this also proves every output is valid JSON.
	assert.deepEqual(inputs.map(code => applySuggestion(code)).filter(output => isReported(output)), []);
});
