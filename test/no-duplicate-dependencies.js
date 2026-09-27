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
	plugins: {json, 'rule-to-test': {rules: {'no-duplicate-dependencies': rule}}},
	rules: {'rule-to-test/no-duplicate-dependencies': 'error'},
}];
const applyFix = (code, fix) => code.slice(0, fix.range[0]) + fix.text + code.slice(fix.range[1]);

snapshotTest.snapshot({
	valid: [
		'{"dependencies": {"a": "1.0.0"}, "devDependencies": {"b": "1.0.0"}}',
		// Peer + dev overlap is allowed.
		'{"peerDependencies": {"a": "1.0.0"}, "devDependencies": {"a": "1.0.0"}}',
		'{"dependencies": {"a": "1.0.0"}}',
	],
	invalid: [
		'{"dependencies": {"a": "1.0.0"}, "devDependencies": {"a": "1.0.0"}}',
		'{"dependencies": {"a": "1.0.0"}, "optionalDependencies": {"a": "1.0.0"}}',
		'{"dependencies": {"a": "1.0.0", "b": "1.0.0"}, "devDependencies": {"b": "2.0.0"}}',
		// Same package across three groups is reported for each later group.
		'{"dependencies": {"a": "1.0.0"}, "devDependencies": {"a": "1.0.0"}, "optionalDependencies": {"a": "1.0.0"}}',
		// Differing specifiers only get a suggestion: npm resolves the conflict to one of them, so removing either changes the installed version.
		'{"dependencies": {"a": "^7.0.0"}, "devDependencies": {"a": "^6.0.0"}}',
		'{"dependencies": {"a": "^1.0.0"}, "optionalDependencies": {"a": "~1.0.0"}}',
		// A non-string duplicate differs from its string counterpart, so it is a suggestion too.
		'{"dependencies": {"a": "1.0.0"}, "devDependencies": {"a": 1}}',
	],
});

test('the `devDependencies` duplicate is the one that goes', () => {
	const code = '{"dependencies": {"foo": "^1"}, "devDependencies": {"foo": "^2", "foo": "^1"}}';
	const messages = linter.verify(code, config, {filename: 'package.json'});

	// The effective `devDependencies` entry matches `dependencies`, so the whole dev run goes. Both removals are suggestions, since a cross-group removal changes what the project root installs.
	assert.deepEqual(
		messages.map(message => applyFix(code, (message.suggestions ?? [message])[0].fix)),
		[
			'{"dependencies": {"foo": "^1"}}',
			'{"dependencies": {"foo": "^1"}}',
		],
	);
	assert.equal(messages[1].fix, undefined);
});

test('suggestions remove only the selected differing dependency', () => {
	const code = '{"dependencies": {"foo": "^1"}, "devDependencies": {"foo": "^2", "foo": "^3"}}';
	const messages = linter.verify(code, config, {filename: 'package.json'});
	const outputs = messages
		.flatMap(message => message.suggestions ?? [])
		.map(suggestion => applyFix(code, suggestion.fix));

	assert.deepEqual(outputs, [
		'{"dependencies": {"foo": "^1"}}',
		'{"dependencies": {"foo": "^1"}}',
	]);
});

test('every removal across groups takes the whole run of that name', () => {
	// A report on a member that only shadows another one still names a name the other group already has, so removing just the member the report points at would leave its effective twin to be reported again.
	const shadowed = '{"dependencies": {"foo": "^2"}, "devDependencies": {"foo": "^1", "foo": "^3"}}';
	const shadowedMessages = linter.verify(shadowed, config, {filename: 'package.json'});

	assert.deepEqual(
		shadowedMessages.map(message => applyFix(
			shadowed,
			(message.suggestions ?? [message])[0].fix,
		)),
		[
			'{"dependencies": {"foo": "^2"}}',
			'{"dependencies": {"foo": "^2"}}',
		],
	);

	// A group that holds another name keeps it, since only the run of this name goes.
	const shared = '{"dependencies": {"foo": "^2"}, "devDependencies": {"bar": "^3", "foo": "^1", "foo": "^1"}}';
	const sharedMessages = linter.verify(shared, config, {filename: 'package.json'});

	assert.deepEqual(
		sharedMessages.map(message => applyFix(
			shared,
			(message.suggestions ?? [message])[0].fix,
		)),
		[
			'{"dependencies": {"foo": "^2"}, "devDependencies": {"bar": "^3"}}',
			'{"dependencies": {"foo": "^2"}, "devDependencies": {"bar": "^3"}}',
		],
	);
});

test('a removal that takes the whole group takes the whole run of that group key', () => {
	// A group left holding nothing is removed with the entry, and the group member it removes is the one `findMember` resolved, which is the final member for its key. Taking only that one would promote a shadowed duplicate back into its place, and the same report would come back on the next round.
	const development = '{"dependencies": {"foo": "^1"}, "devDependencies": {"foo": "^1"}, "devDependencies": {"foo": "^1"}}';
	const [developmentMessage] = linter.verify(development, config, {filename: 'package.json'});
	const output = applyFix(development, developmentMessage.suggestions[0].fix);

	assert.equal(output, '{"dependencies": {"foo": "^1"}}');
	assert.equal(linter.verify(output, config, {filename: 'package.json'}).length, 0);

	// The same shape where the entry goes from `dependencies` in favor of `optionalDependencies`.
	const suggestion = '{"optionalDependencies": {"foo": "^1"}, "dependencies": {"foo": "^1"}, "dependencies": {"foo": "^1"}}';
	const [message] = linter.verify(suggestion, config, {filename: 'package.json'});

	assert.equal(message.fix, undefined);
	assert.equal(applyFix(suggestion, message.suggestions[0].fix), '{"optionalDependencies": {"foo": "^1"}}');
	assert.equal(linter.verify('{"optionalDependencies": {"foo": "^1"}}', config, {filename: 'package.json'}).length, 0);
});

test('the entry that stays is the one a consumer installs', () => {
	// Every removal across groups is a suggestion, since the project root installs the name differently once either entry is gone.
	const fixed = code => {
		const [message] = linter.verify(code, config, {filename: 'package.json'});
		assert.equal(message.fix, undefined);
		return JSON.parse(applyFix(code, message.suggestions[0].fix));
	};

	// A consumer never installs `devDependencies`, so the `dependencies` entry stays and the dev one goes, the way `ajv-formats` and `wrap-ansi` list it.
	assert.deepEqual(
		fixed('{"dependencies": {"foo": "^1.0.0", "bar": "^1.0.0"}, "devDependencies": {"foo": "^1.0.0", "ava": "^1.0.0"}}'),
		{dependencies: {foo: '^1.0.0', bar: '^1.0.0'}, devDependencies: {ava: '^1.0.0'}},
	);

	// An `optionalDependencies` entry reaches consumers too, so it stays over a dev one, the way `minipass-fetch` lists it.
	assert.deepEqual(
		fixed('{"optionalDependencies": {"foo": "^1.0.0", "x": "1"}, "devDependencies": {"foo": "^1.0.0", "ava": "^1.0.0"}}'),
		{optionalDependencies: {foo: '^1.0.0', x: '1'}, devDependencies: {ava: '^1.0.0'}},
	);

	// Removing a `dependencies` entry in favor of the `optionalDependencies` one is a suggestion, which keeps the optional entry, as for `fsevents`.
	const code = '{"dependencies": {"fsevents": "^2.0.0"}, "optionalDependencies": {"fsevents": "^2.0.0"}}';
	const [message] = linter.verify(code, config, {filename: 'package.json'});

	assert.equal(message.fix, undefined);
	assert.deepEqual(JSON.parse(applyFix(code, message.suggestions[0].fix)), {optionalDependencies: {fsevents: '^2.0.0'}});

	// A differing dev entry is only a suggestion, and it still removes the dev one.
	const differing = '{"dependencies": {"foo": "^2.0.0"}, "devDependencies": {"foo": "^1.0.0"}}';
	const [differingMessage] = linter.verify(differing, config, {filename: 'package.json'});

	assert.equal(differingMessage.fix, undefined);
	assert.deepEqual(JSON.parse(applyFix(differing, differingMessage.suggestions[0].fix)), {dependencies: {foo: '^2.0.0'}});
});

test('autofix retains same-group duplicates', () => {
	const code = '{"dependencies": {"foo": "^1.0.0", "foo": "^1.0.0"}}';
	const messages = linter.verify(code, config, {filename: 'package.json'});
	const fix = messages.find(message => message.fix)?.fix;

	assert.ok(fix);
	assert.equal(applyFix(code, fix), '{"dependencies": {"foo": "^1.0.0"}}');
});

test('autofix converges for a same-group duplicate run', () => {
	const code = '{"dependencies": {"foo": "b", "foo": "a", "foo": "a"}}';
	const result = linter.verifyAndFix(code, config, {filename: 'package.json'});

	assert.equal(result.output, '{"dependencies": {"foo": "a"}}');
	assert.equal(linter.verify(result.output, config, {filename: 'package.json'}).length, 0);
});

test('autofix converges when the matching duplicate is later in the run', () => {
	const code = '{"dependencies": {"foo": "b", "foo": "a", "foo": "b", "foo": "b"}}';
	const result = linter.verifyAndFix(code, config, {filename: 'package.json'});

	assert.equal(result.output, '{"dependencies": {"foo": "b"}}');
	assert.equal(linter.verify(result.output, config, {filename: 'package.json'}).length, 0);
});

test('suggestion preserves a different same-group dependency', () => {
	const code = '{"dependencies": {"foo": "^1.0.0", "foo": "^2.0.0"}}';
	const messages = linter.verify(code, config, {filename: 'package.json'});
	const suggestion = messages.flatMap(message => message.suggestions ?? [])[0];

	assert.ok(suggestion);
	assert.equal(applyFix(code, suggestion.fix), '{"dependencies": {"foo": "^1.0.0"}}');
});

test('compares effective dependency specifiers', () => {
	const code = '{"dependencies": {"foo": "^2.0.0"}, "devDependencies": {"foo": "^2.0.0", "foo": "^1.0.0"}}';
	const messages = linter.verify(code, config, {filename: 'package.json'});
	const suggestions = messages.flatMap(message => message.suggestions ?? []);

	assert.equal(messages.filter(message => message.fix).length, 0);
	assert.equal(suggestions.length, 2);
	// Both reports are on the same name in the same group, so both removals take the whole run of it and the group with it, since nothing else is left in it.
	assert.deepEqual(suggestions.map(suggestion => applyFix(code, suggestion.fix)), [
		'{"dependencies": {"foo": "^2.0.0"}}',
		'{"dependencies": {"foo": "^2.0.0"}}',
	]);
});

test('compares parsed dependency specifiers', () => {
	// The two spellings parse to one range, so the shadowed duplicate is removed automatically.
	const code = String.raw`{"dependencies": {"foo": "^1.0.0", "foo": "\u005e1.0.0"}}`;
	const result = linter.verifyAndFix(code, config, {filename: 'package.json'});

	assert.equal(result.output, String.raw`{"dependencies": {"foo": "\u005e1.0.0"}}`);
});
