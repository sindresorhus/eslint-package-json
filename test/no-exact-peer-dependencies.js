/* eslint-disable node-test/no-conditional-assertion -- The loop asserts once per pinned version, and the list is never empty. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {Linter} from 'eslint';
import json from '@eslint/json';
import {getTester} from './utils/test.js';

const {test: snapshotTest, rule} = getTester(import.meta);
const linter = new Linter();
const config = [{
	files: ['**'],
	language: 'json/json',
	plugins: {json, 'rule-to-test': {rules: {'no-exact-peer-dependencies': rule}}},
	rules: {'rule-to-test/no-exact-peer-dependencies': 'error'},
}];
const applyFix = (code, fix) => code.slice(0, fix.range[0]) + fix.text + code.slice(fix.range[1]);

snapshotTest.snapshot({
	valid: [
		'{"peerDependencies": {"react": "^18.2.0"}}',
		'{"peerDependencies": {"react": ">=18"}}',
		'{"peerDependencies": {"react": "*"}}',
		'{"peerDependencies": {"react": "17 || 18"}}',
		'{"peerDependencies": {"react": "workspace:*"}}',
		// A range that actually admits more than one version is not an exact pin, however it is written.
		'{"peerDependencies": {"react": ">=1.0.0"}}',
		'{"peerDependencies": {"react": "==1.0.0"}}',
		'{"peerDependencies": {"react": "<=1.0.0"}}',
		// Non-string value.
		'{"peerDependencies": {"react": 18}}',
		// No `peerDependencies`.
		'{"dependencies": {"react": "18.2.0"}}',
		// Stripping the `=` must not turn an unparseable specifier into a version.
		'{"peerDependencies": {"react": "=not-a-version"}}',
		// An `npm:` alias with a real range is not a pin, and one carrying a tag is not either.
		'{"peerDependencies": {"react": "npm:react-dom@^18.0.0"}}',
		'{"peerDependencies": {"react": "npm:react-dom@latest"}}',
	],
	invalid: [
		// A loose version must normalize before it is put into a range.
		'{"peerDependencies": {"react": "v18.2.0"}}',
		'{"peerDependencies": {"react": "18.2.0+build.1"}}',
		'{"peerDependencies": {"react": "18.2.0"}}',
		'{"peerDependencies": {"react": "2.0.0-beta.1"}}',
		// A `0.x` version needs its minor as the lower bound, since `>=0` is just `*`.
		'{"peerDependencies": {"react": "0.13.0"}}',
		'{"peerDependencies": {"react": "0.0.3"}}',
		// No `>=` bound of a `0.0.0` pin is a range, so the caret range is the only suggestion.
		'{"peerDependencies": {"react": "0.0.0"}}',
		'{"peerDependencies": {"react": "0.13.0-beta.1"}}',
		`{
			"peerDependencies": {
				"react": "18.2.0",
				"vue": "^3.0.0"
			}
		}`,
		// An `=`-prefixed version satisfies exactly one version, the same as the bare pin, so it is the same anti-pattern. `validVersion` wants a bare version, so the operator comes off first.
		'{"peerDependencies": {"react": "=1.0.0"}}',
		'{"peerDependencies": {"react": "=v18.2.0"}}',
		'{"peerDependencies": {"react": "=18.2.0+build.1"}}',
		// An `npm:` alias pins one version when the range it carries is one, and the suggestions keep the alias.
		'{"peerDependencies": {"react": "npm:react-dom@18.2.0"}}',
		'{"peerDependencies": {"react": "npm:@scope/react@18.2.0"}}',
		// A trailing space is one `npm-package-arg` trims off the range it reports, so the alias in front of it has to be found by searching rather than by measuring the tail.
		'{"peerDependencies": {"react": "npm:react-dom@18.2.0 "}}',
	],
});

test('the `>=` suggestion stays a real range for a 0.x pin', () => {
	// `>=0` and `>=0.0.0` both normalize to `*`, so neither the major nor major.minor can be the lower bound of a `0.x` pin, and `0.0.0` has no `>=` bound that is a range at all.
	for (const [pin, ...ranges] of [
		['0.13.0', '^0.13.0', '>=0.13.0'],
		['0.0.3', '^0.0.3', '>=0.0.3'],
		['0.0.0', '^0.0.0'],
	]) {
		const code = `{"peerDependencies": {"react": "${pin}"}}`;
		const messages = linter.verify(code, config, {filename: 'package.json'});
		const outputs = messages
			.flatMap(message => message.suggestions ?? [])
			.map(suggestion => applyFix(code, suggestion.fix));

		assert.deepEqual(
			outputs,
			ranges.map(range => `{"peerDependencies": {"react": "${range}"}}`),
			pin,
		);
	}
});

test('a `+build` the author wrote survives every rewrite', () => {
	// `semver.valid` and `semver.clean` both drop the build metadata, so a rewrite through either of them would quietly remove an identifier the author wrote. The `>=` bound is a range, where build metadata carries no meaning, so that one is left bare.
	const code = '{"peerDependencies": {"react": "1.2.3+build.5"}}';
	const messages = linter.verify(code, config, {filename: 'package.json'});
	const outputs = messages
		.flatMap(message => message.suggestions ?? [])
		.map(suggestion => applyFix(code, suggestion.fix));

	assert.deepEqual(outputs, [
		'{"peerDependencies": {"react": "^1.2.3+build.5"}}',
		'{"peerDependencies": {"react": ">=1"}}',
	]);
});
