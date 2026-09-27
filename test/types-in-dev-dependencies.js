import test from 'node:test';
import assert from 'node:assert/strict';
import {Linter} from 'eslint';
import json from '@eslint/json';
import plugin from '../index.js';
import {getTester} from './utils/test.js';

const {test: snapshotTest, rule} = getTester(import.meta);
const linter = new Linter();
const config = [{
	files: ['**'],
	language: 'json/json',
	plugins: {json, 'rule-to-test': {rules: {'types-in-dev-dependencies': rule}}},
	rules: {'rule-to-test/types-in-dev-dependencies': 'error'},
}];
const sortConfig = [{
	files: ['**'],
	language: 'json/json',
	plugins: {json, 'package-json': plugin},
	rules: {'package-json/sort-properties': 'error', 'package-json/sort-dependencies': 'error'},
}];
const applyFix = (code, fix) => code.slice(0, fix.range[0]) + fix.text + code.slice(fix.range[1]);
const applySuggestion = code => {
	const [message] = linter.verify(code, config, {filename: 'package.json'});
	return applyFix(code, message.suggestions[0].fix);
};

snapshotTest.snapshot({
	valid: [
		// @types/* in devDependencies is fine.
		'{"devDependencies": {"@types/node": "^20.0.0"}}',
		// Non-@types packages in dependencies are fine.
		'{"dependencies": {"foo": "^1.0.0"}}',
		// No dependencies field.
		'{"name": "my-package"}',
		// Regular packages in dependencies are fine.
		'{"dependencies": {"@scope/package": "^1.0.0"}}',
		// @types in both devDeps is fine.
		'{"devDependencies": {"@types/node": "^20.0.0"}, "dependencies": {"foo": "^1.0.0"}}',
		// Non-string values in dependencies are fine.
		'{"dependencies": {"foo": 1}}',
		// Empty dependencies.
		'{"dependencies": {}}',
		// @types in peerDependencies is allowed (a library may expose types from a peer).
		'{"peerDependencies": {"@types/react": ">=18"}}',
		// A manifest that is itself a type package declares the types its declaration file imports, and a
		// consumer gets those from `dependencies` alone, because npm installs no devDependency of a
		// dependency. `@types/debug` depends on `@types/ms` and `@types/mdast` on `@types/unist` for this.
		'{"name": "@types/debug", "version": "1.0.0", "dependencies": {"@types/ms": "*"}}',
		'{"name": "@types/mdast", "version": "1.0.0", "dependencies": {"@types/unist": "*"}}',
		// Ignored package name: its types leak into the public API, so it must stay a real dependency.
		{
			code: '{"dependencies": {"@types/node": "^20.0.0"}}',
			options: [{ignore: ['@types/node']}],
		},
	],
	invalid: [
		// @types/* in dependencies should be flagged.
		'{"dependencies": {"@types/node": "^20.0.0"}}',
		// Multiple @types in dependencies.
		'{"dependencies": {"@types/node": "^20.0.0", "@types/react": "^18.0.0"}}',
		// Mixed: regular and @types in dependencies.
		'{"dependencies": {"foo": "^1.0.0", "@types/node": "^20.0.0"}}',
		// @types with scoped name.
		'{"dependencies": {"@types/some-package": "^1.0.0"}}',
		// @types in optionalDependencies should also be flagged (no runtime value there either).
		'{"optionalDependencies": {"@types/node": "^20.0.0"}}',
		// Moving into an existing, non-empty devDependencies.
		'{"dependencies": {"@types/node": "^20.0.0"}, "devDependencies": {"foo": "^1.0.0"}}',
		// Already present in devDependencies at a different range: ambiguous, no fix is offered.
		'{"dependencies": {"@types/node": "^20.0.0"}, "devDependencies": {"@types/node": "^19.0.0"}}',
		// A malformed (non-object) devDependencies is left to `valid-fields`; no fix is offered.
		'{"dependencies": {"@types/node": "^20.0.0"}, "devDependencies": "invalid"}',
		// Removing only the effective member would leave the earlier duplicate in `dependencies`, and removing
		// the entry alone would leave a `{"dependencies": {}}` behind, which `no-empty-fields` reports as a
		// problem this suggestion created. The group goes with the entry instead.
		'{"dependencies": {"@types/node": "^19.0.0", "@types/node": "^20.0.0"}}',
		// A non-string range is malformed; the entry is reported but no fix is offered.
		'{"dependencies": {"@types/node": 1}}',
		// Multiline input: the moved entry preserves the file's indentation.
		`{
	"dependencies": {
		"@types/node": "^20.0.0"
	},
	"devDependencies": {
		"foo": "^1.0.0"
	}
}`,
		// An existing but empty group written on one line stays on one line, the way a non-empty one does.
		'{"name": "x", "dependencies": {"@types/node": "^20.0.0"}, "devDependencies": {}}',
		// A `devDependencies` group that has to be created goes on one line when the root is on one line.
		'{"name": "x", "version": "1.0.0", "dependencies": {"@types/node": "^20.0.0"}}',
		// Already in `devDependencies` at the same range, so the move only has to take the entry out of
		// `dependencies` and the suggestion does that alone. The group goes with the entry when that was its
		// last one, since an empty group is what `no-empty-fields` reports.
		'{"dependencies": {"@types/node": "^20.0.0"}, "devDependencies": {"@types/node": "^20.0.0"}}',
		'{"name": "x", "dependencies": {"@types/node": "^20.0.0"}, "devDependencies": {"@types/node": "^20.0.0"}}',
		'{"name": "x", "dependencies": {"@types/node": "^20.0.0", "foo": "^1.0.0"}, "devDependencies": {"@types/node": "^20.0.0", "bar": "^2.0.0"}}',
		// A malformed entry in `devDependencies` gives nothing to compare against, so the range is ambiguous.
		'{"dependencies": {"@types/node": "^20.0.0"}, "devDependencies": {"@types/node": 1}}',
		// A duplicated `dependencies` member is the one `findMember` resolved that the group removal takes, and
		// leaving the earlier duplicate behind would promote it straight back into the group's place.
		'{"name": "x", "dependencies": {"@types/node": "^20.0.0"}, "dependencies": {"@types/node": "^20.0.0"}, "devDependencies": {"@types/node": "^20.0.0"}}',
		// The created group and the moved entry go where a sorted document holds them.
		'{"name": "x", "dependencies": {"@types/node": "^20.0.0", "foo": "^1.0.0"}, "peerDependencies": {"bar": "^1.0.0"}}',
		'{"dependencies": {"@types/node": "^20.0.0"}, "devDependencies": {"ava": "1", "xo": "1"}}',
		// Renaming the group to `devDependencies` would promote the earlier duplicate `dependencies` into its place.
		'{\n\t"dependencies": {\n\t\t"b": "1"\n\t},\n\t"dependencies": {\n\t\t"@types/x": "^1.0.0"\n\t}\n}',
	],
});

test('renaming the group drops its shadowed duplicates', () => {
	// Renaming only the effective `dependencies` member would promote the earlier one back into its place, and with it a dependency the manifest does not have.
	assert.deepEqual(
		JSON.parse(applySuggestion('{\n\t"dependencies": {\n\t\t"b": "1"\n\t},\n\t"dependencies": {\n\t\t"@types/x": "^1.0.0"\n\t}\n}')),
		{devDependencies: {'@types/x': '^1.0.0'}},
	);
	assert.deepEqual(
		JSON.parse(applySuggestion('{"name": "x", "dependencies": {"b": "1"}, "dependencies": {"@types/x": "^1.0.0"}}')),
		{name: 'x', devDependencies: {'@types/x': '^1.0.0'}},
	);
});

test('the suggestion keeps a sorted document sorted', () => {
	const inputs = [
		'{"dependencies": {"@types/node": "^20.0.0"}}',
		'{"name": "x", "dependencies": {"@types/node": "^20.0.0", "foo": "^1.0.0"}}',
		'{"name": "x", "dependencies": {"@types/node": "^20.0.0", "foo": "^1.0.0"}, "peerDependencies": {"bar": "^1.0.0"}}',
		'{"name": "x", "optionalDependencies": {"@types/node": "^20.0.0", "foo": "^1.0.0"}, "custom": true}',
		'{"dependencies": {"@types/node": "^20.0.0"}, "devDependencies": {"ava": "1", "xo": "1"}}',
		'{"dependencies": {"@types/node": "^20.0.0"}, "devDependencies": {}}',
		'{"name": "x", "name": "y", "dependencies": {"@types/node": "^20.0.0", "foo": "^1.0.0"}}',
		'{\n\t"name": "x",\n\t"dependencies": {\n\t\t"@types/node": "^20.0.0",\n\t\t"foo": "^1.0.0"\n\t}\n}',
		'{\n  "dependencies": {\n    "@types/node": "^20.0.0"\n  },\n  "devDependencies": {\n    "ava": "1",\n    "xo": "1"\n  }\n}',
		'{\n    "dependencies": {\n        "@types/node": "^20.0.0",\n        "foo": "^1.0.0"\n    },\n    "peerDependencies": {\n        "bar": "^1.0.0"\n    }\n}',
	];

	const isReported = code => linter.verify(code, sortConfig, {filename: 'package.json'}).length > 0;

	assert.deepEqual(inputs.filter(code => isReported(code)), []);
	// A document that does not parse is reported too, so this also proves every output is valid JSON.
	assert.deepEqual(inputs.map(code => applySuggestion(code)).filter(output => isReported(output)), []);

	assert.equal(
		applySuggestion('{"dependencies": {"@types/node": "^20.0.0"}, "devDependencies": {"ava": "1", "xo": "1"}}'),
		'{"devDependencies": {"@types/node": "^20.0.0", "ava": "1", "xo": "1"}}',
	);
});

test('a group removal takes the whole run of that group key', () => {
	// The group is reached through `findMember`, so the member the fix takes is the final one for its key.
	// Removing only that one promotes the earlier duplicate into its place, which is the very report the
	// suggestion was offered for.
	const code = '{"name": "x", "dependencies": {"@types/node": "^20.0.0"}, "dependencies": {"@types/node": "^20.0.0"}, "devDependencies": {"@types/node": "^20.0.0"}}';
	const [message] = linter.verify(code, config, {filename: 'package.json'});

	assert.equal(applyFix(code, message.suggestions[0].fix), '{"name": "x", "devDependencies": {"@types/node": "^20.0.0"}}');
	assert.equal(linter.verify('{"name": "x", "devDependencies": {"@types/node": "^20.0.0"}}', config, {filename: 'package.json'}).length, 0);
});
