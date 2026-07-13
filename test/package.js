/* eslint-disable node-test/no-conditional-assertion -- The meta-tests assert per rule inside loops over the rule list, which is always non-empty. */
import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {Linter} from 'eslint';
import json from '@eslint/json';
import plugin from '../index.js';

const byName = (a, b) => a.localeCompare(b);

const readNames = directory => fs.readdirSync(new URL(directory, import.meta.url))
	.filter(name => name.endsWith('.js') && name !== 'index.js')
	.map(name => name.replace(/\.js$/, ''));

const ruleIds = Object.keys(plugin.rules);
const ruleFiles = readNames('../rules/');
const testFiles = readNames('../test/').filter(name => name !== 'package');
const docFiles = fs.readdirSync(new URL('../docs/rules/', import.meta.url))
	.filter(name => name.endsWith('.md'))
	.map(name => name.replace(/\.md$/, ''));

const withoutPrefix = ruleKey => ruleKey.replace('package-json/', '');

test('every rule file is exported from the barrel', () => {
	assert.deepEqual(ruleIds.toSorted(byName), ruleFiles.toSorted(byName));
});

test('every rule has a matching test file', () => {
	assert.deepEqual(ruleIds.toSorted(byName), testFiles.toSorted(byName));
});

test('every rule has a matching documentation file', () => {
	assert.deepEqual(ruleIds.toSorted(byName), docFiles.toSorted(byName));
});

test('every rule has well-formed meta', () => {
	for (const id of ruleIds) {
		const {meta} = plugin.rules[id];

		assert.ok(['problem', 'suggestion', 'layout'].includes(meta.type), `${id}: invalid type`);
		assert.deepEqual(meta.languages, ['json/json'], `${id}: must declare json/json language`);
		assert.equal(typeof meta.docs.description, 'string', `${id}: missing description`);
		assert.ok(meta.docs.description.endsWith('.'), `${id}: description must end with a period`);
		assert.equal(typeof meta.docs.recommended, 'boolean', `${id}: recommended must be a boolean`);
		assert.equal(typeof meta.docs.url, 'string', `${id}: missing docs url`);
		assert.ok(Array.isArray(meta.schema), `${id}: schema must be an array`);
		assert.ok(Object.keys(meta.messages ?? {}).length > 0, `${id}: missing messages`);
	}
});

test('config rule keys all reference real rules', () => {
	for (const [configName, config] of Object.entries(plugin.configs)) {
		for (const ruleKey of Object.keys(config.rules)) {
			assert.ok(ruleIds.includes(withoutPrefix(ruleKey)), `${configName}: unknown rule ${ruleKey}`);
		}
	}
});

test('recommended config contains exactly the recommended rules', () => {
	const expected = ruleIds.filter(id => plugin.rules[id].meta.docs.recommended);
	const actual = Object.keys(plugin.configs.recommended.rules).map(key => withoutPrefix(key));
	assert.deepEqual(actual.toSorted(byName), expected.toSorted(byName));
});

test('prefer-exports is recommended', () => {
	const ruleKey = 'package-json/prefer-exports';
	assert.equal(plugin.configs.recommended.rules[ruleKey], 'error');
});

test('all config contains every rule set to error', () => {
	const actual = Object.keys(plugin.configs.all.rules).map(key => withoutPrefix(key));
	assert.deepEqual(actual.toSorted(byName), ruleIds.toSorted(byName));
	assert.ok(Object.values(plugin.configs.all.rules).every(value => value === 'error'));
});

test('the recommended config works end-to-end through ESLint', () => {
	const linter = new Linter();
	const config = [plugin.configs.recommended];

	const problems = linter.verify('{"name": "Foo"}', config, {filename: 'package.json'});
	assert.ok(
		problems.some(message => message.ruleId === 'package-json/valid-fields'),
		'an invalid name should be reported via the recommended config',
	);

	const legacyEntryPointProblems = linter.verify('{"exports": "./index.js", "main": "./index.js"}', config, {filename: 'package.json'});
	assert.ok(
		legacyEntryPointProblems.some(message => message.ruleId === 'package-json/prefer-exports'),
		'legacy entry points should be reported via the recommended config',
	);

	const nestedPackageProblems = linter.verify('{"name": "foo", "exports": "./index.js"}', config, {filename: 'dist/package.json'});
	assert.ok(
		nestedPackageProblems.some(message => message.ruleId === 'package-json/no-nested-exports'),
		'an ignored field in a nested package.json should be reported via the recommended config',
	);

	const cleanInput = JSON.stringify({
		name: 'foo',
		version: '1.0.0',
		description: 'A test package.',
		license: 'MIT',
		type: 'module',
		exports: './index.js',
		sideEffects: false,
		engines: {node: '>=18'},
		scripts: {test: 'node --test', build: 'node build.js'},
		files: ['index.js'],
		keywords: ['cli'],
	});
	const clean = linter.verify(cleanInput, config, {filename: 'package.json'});
	assert.deepEqual(clean, [], 'a clean package.json should produce no problems');

	// The config is scoped to package.json, so its rules never run on other JSON files.
	const otherFile = linter.verify('{"name": "Foo"}', config, {filename: 'tsconfig.json'});
	assert.ok(
		otherFile.every(message => !message.ruleId?.startsWith('package-json/')),
		'package-json rules should not run on non-package.json files',
	);
});

test('no rule crashes on a non-object or unusual root', () => {
	const linter = new Linter();
	const roots = ['[]', '"string"', '42', 'true', 'null', '{}'];

	for (const id of ruleIds) {
		for (const code of roots) {
			const messages = linter.verify(code, {
				files: ['**'],
				language: 'json/json',
				plugins: {
					json,
					'rule-to-test': {rules: {[id]: plugin.rules[id]}},
				},
				rules: {[`rule-to-test/${id}`]: 'error'},
			}, {filename: 'package.json'});

			const fatal = messages.find(message => message.fatal);
			assert.ok(!fatal, `${id} crashed on \`${code}\`: ${fatal?.message}`);
		}
	}
});
