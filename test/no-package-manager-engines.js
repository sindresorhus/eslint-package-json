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
const applyMigration = code => {
	const [message] = lint(code, {'package-json/no-package-manager-engines': 'error'});
	const {fix} = message.suggestions.find(suggestion => suggestion.messageId === 'migrate');
	return code.slice(0, fix.range[0]) + fix.text + code.slice(fix.range[1]);
};

snapshotTest.snapshot({
	valid: [
		// Only `node` is allowed.
		'{"engines": {"node": ">=18"}}',
		// No `engines` field.
		'{"name": "foo"}',
		// `engines` is not an object.
		'{"engines": ">=18"}',
		// The modern mechanism.
		'{"packageManager": "pnpm@9.0.0"}',
		// `packageManager` names a single manager, so a tool declaring which ones it supports has no replacement to migrate to.
		'{"engines": {"node": ">=18", "npm": ">=10", "yarn": ">=1.7.0", "pnpm": ">=11", "bun": ">=1"}}',
		'{"engines": {"npm": ">=10", "pnpm": ">=9"}}',
		'{"engines": {"npm": ">=10", "yarn": ">=4"}}',
	],
	invalid: [
		// Every alternative has a lower bound, so a `packageManager` version can be inferred.
		'{"engines": {"npm": ">=8 || >=9"}}',
		// One alternative has no lower bound, so no version can be inferred and only removal is offered.
		'{"engines": {"npm": ">=8 || <9"}}',
		'{"engines": {"npm": ">=10"}}',
		'{"engines": {"yarn": ">=4"}}',
		'{"engines": {"pnpm": ">=9"}}',
		// Bun is reported but cannot be migrated through Corepack.
		'{"engines": {"bun": ">=1"}}',
		// Mixed with the allowed `node` engine.
		`{
			"engines": {
				"node": ">=18",
				"npm": ">=10"
			}
		}`,
		// The migration suggestion should add the inferred package manager field.
		`{
			"engines": {
				"node": ">=24",
				"npm": ">=11"
			}
		}`,
		// Remove a manager that is not the last nested member and preserve following top-level fields.
		`{
			"name": "foo",
			"engines": {
				"npm": ">=11",
				"node": ">=24"
			},
			"scripts": {}
		}`,
		// Replace a sole manager engine without disturbing surrounding top-level fields.
		`{
			"name": "foo",
			"engines": {
				"npm": ">=10"
			},
			"scripts": {}
		}`,
		// A key repeated is still a single manager, so it is reported rather than treated as multi-manager support, and the migration pins the range npm actually enforces.
		'{"engines": {"npm": ">=8", "npm": ">=9"}}',
		'{"engines": {"node": ">=18", "npm": ">=10", "npm": ">=12"}}',
		// Do not replace an existing package manager field, regardless of its value type.
		'{"packageManager": "npm@10.0.0", "engines": {"npm": ">=10"}}',
		'{"packageManager": true, "engines": {"npm": ">=10"}}',
		// Ranges without a lower bound cannot be safely pinned.
		'{"engines": {"npm": "<11"}}',
		// Compound ranges use their lowest semver version.
		'{"engines": {"npm": ">=10 <11"}}',
		// Strict lower bounds pin the next semver release.
		'{"engines": {"npm": ">10"}}',
		// Bare versions are normalized to three components.
		'{"engines": {"npm": "10.2"}}',
		// Prerelease lower bounds are valid exact package manager versions.
		'{"engines": {"npm": ">=10.0.0-beta.1"}}',
		// An unbounded alternative cannot be safely pinned.
		'{"engines": {"npm": ">=10 || *"}}',
		// Every bounded alternative can be migrated.
		'{"engines": {"npm": ">=10 || >=12"}}',
		// Preserve top-level single-line formatting when `engines` is multiline.
		'{"engines": {\n\t"node": ">=18",\n\t"npm": ">=10"\n}}',
		// A shadowed duplicate `engines` must go too, or removing the effective one promotes it into its place.
		'{"engines": {"npm": ">=8"}, "engines": {"yarn": ">=1"}}',
		// Wildcards, malformed values, and non-string values cannot be safely pinned.
		'{"engines": {"npm": "*"}}',
		'{"engines": {"npm": ""}}',
		'{"engines": {"npm": "latest"}}',
		'{"engines": {"npm": true}}',
	],
});

test('the migration keeps a sorted document sorted', () => {
	const sortRules = {'package-json/sort-properties': 'error'};
	const inputs = [
		'{"name": "a", "engines": {"node": ">=20", "pnpm": ">=9.0.0"}, "os": ["linux"], "scripts": {}}',
		'{"name": "a", "engines": {"pnpm": ">=9.0.0"}, "os": ["linux"], "scripts": {}}',
		'{"name": "a", "engines": {"pnpm": ">=9.0.0"}, "devEngines": {"runtime": {"name": "node"}}, "publishConfig": {"access": "public"}}',
		'{"name": "a", "engines": {"npm": ">=10"}, "scripts": {}}',
		'{"name": "a", "engines": {"node": ">=20", "npm": ">=10"}}',
		'{"engines": {"npm": ">=10"}}',
		'{"engines": {"npm": ">=8"}, "engines": {"yarn": ">=1"}, "cpu": ["x64"]}',
		'{\n\t"name": "a",\n\t"engines": {\n\t\t"node": ">=20",\n\t\t"pnpm": ">=9.0.0"\n\t},\n\t"os": [\n\t\t"linux"\n\t],\n\t"scripts": {}\n}',
		'{\n\t"name": "a",\n\t"engines": {\n\t\t"pnpm": ">=9.0.0"\n\t},\n\t"publishConfig": {}\n}',
	];

	const isReported = code => lint(code, sortRules).length > 0;

	assert.deepEqual(inputs.filter(code => isReported(code)), []);
	// A document that does not parse is reported too, so this also proves every output is valid JSON.
	assert.deepEqual(inputs.map(code => applyMigration(code)).filter(output => isReported(output)), []);
});

test('the migration puts `packageManager` after the fields a sorted document holds before it', () => {
	assert.equal(
		applyMigration('{"name": "a", "engines": {"node": ">=20", "pnpm": ">=9.0.0"}, "os": ["linux"], "scripts": {}}'),
		'{"name": "a", "engines": {"node": ">=20"}, "os": ["linux"], "packageManager": "pnpm@9.0.0", "scripts": {}}',
	);
	assert.equal(
		applyMigration('{"name": "a", "engines": {"pnpm": ">=9.0.0"}, "os": ["linux"], "scripts": {}}'),
		'{"name": "a", "os": ["linux"], "packageManager": "pnpm@9.0.0", "scripts": {}}',
	);
	assert.equal(applyMigration('{"engines": {"npm": ">=10"}}'), '{"packageManager": "npm@10.0.0"}');
	assert.equal(
		applyMigration('{\n\t"name": "a",\n\t"engines": {\n\t\t"pnpm": ">=9.0.0"\n\t},\n\t"publishConfig": {}\n}'),
		'{\n\t"name": "a",\n\t"publishConfig": {},\n\t"packageManager": "pnpm@9.0.0"\n}',
	);
});
