/* eslint-disable node-test/no-conditional-assertion -- The meta-tests assert per rule inside loops over the rule list, which is always non-empty. */
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import {Linter} from 'eslint';
import {defineConfig} from 'eslint/config';
import json from '@eslint/json';
import semver from 'semver';
import plugin from '../index.js';
import {
	fieldOrder,
	removeMembers,
	validRange,
	withoutShadowedMembers,
} from '../rules/utils/index.js';

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

// Whether a rule is on by default is a product decision, so it is spelled out here rather than derived from `meta.docs.recommended`. Deriving it would make this test tautological: flipping the flag on a rule would silently move it between configs with nothing to catch it. Adding a rule means adding it to exactly one of these lists.
const recommendedRuleIds = [
	'consistent-path-prefix',
	'dependency-version-range',
	'no-absolute-paths',
	'no-backslash-paths',
	'no-core-module-dependencies',
	'no-deprecated-fields',
	'no-dist-tag-dependencies',
	'no-duplicate-dependencies',
	'no-empty-fields',
	'no-exports-trailing-slash',
	'no-fallback-export-arrays',
	'no-http-dependencies',
	'no-install-scripts',
	'no-invalid-direct-overrides',
	'no-manual-maintainers',
	'no-nested-exports',
	'no-orphan-script-hooks',
	'no-orphan-types',
	'no-overrides-in-published-package',
	'no-package-manager-engines',
	'no-redundant-files',
	'no-self-dependency',
	'no-typo-fields',
	'no-wildcard-dependencies',
	'no-workspace-protocol-in-published-package',
	'peer-dependencies-as-dev-dependencies',
	'prefer-engines-range',
	'prefer-exports',
	'prefer-files-field',
	'prefer-https-urls',
	'prefer-shorthand',
	'prefer-side-effects-field',
	'prefer-type-module',
	'require-bin-shebang',
	'require-default-condition',
	'require-engines',
	'require-entry-point',
	'require-fields',
	'require-private-when-workspaces',
	'require-types-in-exports',
	'sort-dependencies',
	'sort-files',
	'sort-properties',
	'valid-fields',
];

const optInRuleIds = [
	'consistent-name-casing',
	'description-format',
	'no-exact-peer-dependencies',
	'no-git-dependencies',
	'no-local-dependencies',
	'no-missing-files',
	'no-pre-release-dependencies',
	'no-redundant-repository-fields',
	'no-restricted-dependencies',
	'no-restricted-fields',
	'prefer-provenance',
	'require-exports-root',
	'require-private',
	'restrict-fields-when-private',
	'sort-scripts',
	'types-in-dev-dependencies',
];

test('every rule is classified as recommended or opt-in exactly once', () => {
	assert.deepEqual(
		[...recommendedRuleIds, ...optInRuleIds].toSorted(byName),
		ruleIds.toSorted(byName),
		'a new rule must be added to either `recommendedRuleIds` or `optInRuleIds`',
	);
});

test('each rule\'s `recommended` flag matches its classification', () => {
	for (const id of recommendedRuleIds) {
		assert.equal(plugin.rules[id].meta.docs.recommended, true, `${id} should be recommended`);
	}

	for (const id of optInRuleIds) {
		assert.equal(plugin.rules[id].meta.docs.recommended, false, `${id} should be opt-in`);
	}
});

test('recommended config contains exactly the recommended rules', () => {
	const actual = Object.keys(plugin.configs.recommended.rules).map(key => withoutPrefix(key));
	assert.deepEqual(actual.toSorted(byName), recommendedRuleIds.toSorted(byName));
	assert.ok(Object.values(plugin.configs.recommended.rules).every(value => value === 'error'));
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

	const getRelevantTypesTargetProblems = code => linter.verify(code, config, {filename: 'package.json'})
		.filter(message => ['package-json/require-types-in-exports', 'package-json/valid-fields'].includes(message.ruleId))
		.map(message => `${message.ruleId}/${message.messageId}`)
		.toSorted(byName);
	assert.deepEqual(getRelevantTypesTargetProblems('{"exports": {"types": {"import": [[{"node": false}]]}, "import": {"node": "./index.js"}}}'), [
		'package-json/require-types-in-exports/missing',
		'package-json/valid-fields/exports/targetType',
	]);
	assert.deepEqual(getRelevantTypesTargetProblems('{"exports": {"types": "", "default": "./index.js"}}'), [
		'package-json/require-types-in-exports/missing',
		'package-json/valid-fields/exports/relativePath',
	]);
	assert.deepEqual(getRelevantTypesTargetProblems('{"exports": {"types": ["./index.d.ts", false], "default": "./index.js"}}'), [
		'package-json/valid-fields/exports/targetType',
	]);

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

test('SemVer result cache is bounded', () => {
	const originalValidRange = semver.validRange;
	let parseCount = 0;
	semver.validRange = value => {
		parseCount++;
		return originalValidRange(value);
	};

	try {
		const specifiers = Array.from({length: 1001}, (_, index) => `__bounded-cache-test__${index}`);

		for (const specifier of specifiers) {
			validRange(specifier);
		}

		const parseCountAfterFilling = parseCount;
		validRange(specifiers[0]);
		assert.equal(parseCount, parseCountAfterFilling + 1);
	} finally {
		semver.validRange = originalValidRange;
	}
});

test('the recommended config works with string `extends` without manually naming the plugin', () => {
	const linter = new Linter();
	const config = defineConfig({
		files: ['**/package.json'],
		plugins: {packageJson: plugin},
		extends: ['packageJson/recommended'],
	});

	const problems = linter.verify('{"name": "Foo"}', config, {filename: 'package.json'});
	assert.ok(
		problems.some(message => message.ruleId === 'package-json/valid-fields'),
		'an invalid name should be reported via the recommended config',
	);
});

test('the plugin works with a shorthand alias', () => {
	const linter = new Linter();
	const config = defineConfig({
		files: ['**/package.json'],
		language: 'json/json',
		plugins: {json, packageJson: plugin},
		rules: {'packageJson/valid-fields': 'error'},
	});

	const problems = linter.verify('{"name": "Foo"}', config, {filename: 'package.json'});
	assert.ok(
		problems.some(message => message.ruleId === 'packageJson/valid-fields'),
		'an invalid name should be reported through the shorthand alias',
	);
});

// Documents that exercise the shapes autofixes are easiest to get wrong on: empty and single-line containers, duplicate keys, nested and mixed-type `exports` trees, CRLF, and unusual indentation.
const trickyDocuments = [
	'{}',
	'{"files":[]}',
	'{"files":["package.json","package.json"]}',
	'{"files":["readme.md","index.js","index.d.ts"]}',
	'{"dependencies":{}}',
	'{"dependencies":{"b":"^1.0.0","a":"^1.0.0"}}',
	'{"dependencies":{"a":"^1.0.0","a":"^2.0.0"}}',
	'{"scripts":{"b":"b","a":"a"},"dependencies":{"z":"^1.0.0","a":"^1.0.0"}}',
	'{"version":"1.0.0","name":"foo"}',
	'{"exports":{".":{"default":"./a.js","types":"./a.d.ts"}}}',
	'{"exports":{".":[{"types":"./a.d.ts"},"./a.js"]}}',
	'{"exports":{"./a/":"./a/","./b":"b"}}',
	'{"overrides":{"foo":"1.0.0"},"dependencies":{"foo":"^2.0.0"}}',
	'{"overrides":{"foo":{}},"dependencies":{"foo":"^2.0.0"}}',
	'{"peerDependencies":{"foo":"^1.0.0"}}',
	'{"dependancies":{"a":"^1.0.0"}}',
	// Duplicate keys at the top level and nested, where a fix that removes only the effective member promotes the shadowed one into its place.
	'{"engines":{"npm":">=8"},"engines":{"yarn":">=1"}}',
	'{"maintainers":["a"],"maintainers":["b"]}',
	'{"overrides":{"a":"1.0.0"},"overrides":{"b":"1.0.0"}}',
	'{"repository":"foo/bar","homepage":"https://old.example.com","homepage":"https://github.com/foo/bar#readme"}',
	'{"name":"foo","publishConfig":{"access":"restricted","access":"public"}}',
	'{"peerDependencies":{"a":"^1.0.0"},"peerDependenciesMeta":{"a":{"optional":true,"optional":false}}}',
	'{"scripts":{"postinstall":"a","postinstall":"b"}}',
	'{\r\n\t"dependencies": {\r\n\t\t"b": "^1.0.0",\r\n\t\t"a": "^1.0.0"\r\n\t}\r\n}',
	'{\n    "dependencies": {\n        "b": "^1.0.0",\n        "a": "^1.0.0"\n    }\n}',
	'{\n  "files": [\n    "b.js",\n    "a.js"\n  ]\n}',
];

const parseOrFail = (text, description) => {
	try {
		return JSON.parse(text);
	} catch (error) {
		assert.fail(`${description} produced invalid JSON (${error.message}):\n${text}`);
	}
};

const ruleOnlyConfig = (id, rule = plugin.rules[id]) => ({
	files: ['**'],
	language: 'json/json',
	plugins: {json, 'rule-to-test': {rules: {[id]: rule}}},
	rules: {[`rule-to-test/${id}`]: 'error'},
});

test('every autofix and suggestion keeps the document valid JSON', () => {
	const linter = new Linter();
	const config = [plugin.configs.all];

	for (const code of trickyDocuments) {
		const {output, fixed} = linter.verifyAndFix(code, config, {filename: 'package.json'});

		if (fixed) {
			parseOrFail(output, `fixing \`${code}\``);

			// A second pass must find nothing left to fix, or the rules disagree and `--fix` would oscillate.
			assert.equal(linter.verifyAndFix(output, config, {filename: 'package.json'}).fixed, false, `fixing \`${code}\` did not converge`);
		}

		const suggestions = linter.verify(code, config, {filename: 'package.json'})
			.flatMap(message => (message.suggestions ?? []).map(suggestion => ({message, suggestion})));

		for (const {message, suggestion} of suggestions) {
			const [start, end] = suggestion.fix.range;
			const suggested = code.slice(0, start) + suggestion.fix.text + code.slice(end);
			parseOrFail(suggested, `${message.ruleId} suggestion "${suggestion.desc}" on \`${code}\``);
		}
	}
});

test('every suggestion resolves the problem it is offered for', () => {
	const linter = new Linter();
	const countMatching = (messages, {ruleId, messageId}) => messages.filter(message => message.ruleId === ruleId && message.messageId === messageId).length;

	for (const id of ruleIds) {
		const config = ruleOnlyConfig(id);

		for (const code of trickyDocuments) {
			const messages = linter.verify(code, config, {filename: 'package.json'});

			for (const message of messages) {
				for (const suggestion of message.suggestions ?? []) {
					const [start, end] = suggestion.fix.range;
					const suggested = code.slice(0, start) + suggestion.fix.text + code.slice(end);
					const after = linter.verify(suggested, config, {filename: 'package.json'});

					// A suggestion that leaves as many instances of its own problem behind did not fix anything. The usual cause is removing only the effective member of a duplicated key, which promotes the shadowed one into its place.
					assert.ok(
						countMatching(after, message) < countMatching(messages, message),
						`${id} suggestion "${suggestion.desc}" on \`${code}\` left \`${message.messageId}\` unresolved:\n${suggested}`,
					);
				}
			}
		}
	}
});

test('sort fixes only reorder, never lose or alter entries', () => {
	const linter = new Linter();
	// `files` is an array, so sorting it is meant to change the order; compare it as a multiset instead.
	const normalize = value => Array.isArray(value?.files)
		? {...value, files: value.files.toSorted(byName)}
		: value;

	const sortRuleIds = ruleIds.filter(ruleId => ruleId.startsWith('sort-'));

	for (const id of sortRuleIds) {
		const config = ruleOnlyConfig(id);

		for (const code of trickyDocuments) {
			const {output, fixed} = linter.verifyAndFix(code, config, {filename: 'package.json'});

			if (fixed) {
				assert.deepEqual(normalize(JSON.parse(output)), normalize(JSON.parse(code)), `${id} changed more than the order of \`${code}\``);
			}
		}
	}
});

test('no rule writes an unusable version range', () => {
	const linter = new Linter();
	// Specifiers that stress the range parsers, including malformed ones a rule must decline to convert.
	const specifiers = ['1.2.3', 'v1.2.3', '^1.2.3', '*', 'x', '', 'latest', '^', '~', '^abc', '^-1', '1.2.3+build', '^18 || ^20', 'workspace:*', 'file:../a', 'github:u/r'];
	const rangeGroups = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies'];

	const manifests = [];
	for (const specifier of specifiers) {
		for (const group of rangeGroups) {
			manifests.push({name: 'pkg', version: '1.0.0', [group]: {foo: specifier}});
		}

		for (const engine of ['node', 'npm', 'pnpm']) {
			manifests.push({name: 'pkg', version: '1.0.0', engines: {[engine]: specifier}});
		}
	}

	// Every range-bearing entry in a document, so a rewritten one can be checked.
	const collectRanges = value => [
		...rangeGroups.flatMap(group => Object.entries(value?.[group] ?? {}).map(([name, range]) => [`${group}.${name}`, range])),
		...Object.entries(value?.engines ?? {}).map(([engine, range]) => [`engines.${engine}`, range]),
	];

	for (const id of ruleIds) {
		const config = ruleOnlyConfig(id);

		for (const manifest of manifests) {
			const code = JSON.stringify(manifest, undefined, '\t');
			const before = new Map(collectRanges(manifest));
			const messages = linter.verify(code, config, {filename: 'package.json'});
			const edits = messages.flatMap(message => [
				...(message.fix ? [message.fix] : []),
				...(message.suggestions ?? []).map(suggestion => suggestion.fix),
			]);

			// Ranges the edit synthesized, as opposed to ones it left alone or merely relocated from elsewhere in the document.
			const synthesizedRanges = fix => {
				const output = code.slice(0, fix.range[0]) + fix.text + code.slice(fix.range[1]);

				try {
					return collectRanges(JSON.parse(output))
						.filter(([where, range]) => range !== before.get(where) && !code.includes(JSON.stringify(range)));
				} catch {
					return [];
				}
			};

			for (const [where, range] of edits.flatMap(fix => synthesizedRanges(fix))) {
				assert.notEqual(semver.validRange(range), null, `${id} wrote an unusable range at ${where}: ${JSON.stringify(before.get(where))} -> ${JSON.stringify(range)}`);
			}
		}
	}
});

// A small deterministic generator (Park-Miller), so a failure always reproduces. Every intermediate stays well inside the exact-integer range of a double.
const createRandom = initialSeed => {
	let seed = initialSeed;

	return () => {
		seed = (seed * 16_807) % 2_147_483_647;
		return seed / 2_147_483_647;
	};
};

test('every report is well-formed on arbitrarily shaped documents', () => {
	const linter = new Linter();
	// The option-driven rules stay silent until configured, so the fuzzer would never exercise them without options.
	const config = [
		plugin.configs.all,
		{
			files: ['**/package.json'],
			rules: {
				'package-json/no-restricted-dependencies': ['error', {packages: ['lodash']}],
				'package-json/no-restricted-fields': ['error', {fields: ['browserify']}],
				'package-json/restrict-fields-when-private': ['error', {fields: ['publishConfig']}],
			},
		},
	];

	const containerKeys = [
		'.',
		'./a',
		'./*',
		'#a',
		'url',
		'email',
		'name',
		'type',
		'optional',
		'provenance',
		'access',
		'tag',
		'registry',
		'node',
		'import',
		'require',
		'default',
		'types',
		'browser',
		'runtime',
		'version',
		'onFail',
		'packages',
		'directory',
	];
	// A spread of the specifier, path, glob, and URL shapes the rules parse, so the traversal reaches the branches that only fire on real-looking values. The `http:` URL is the insecure form `no-http-dependencies`/`prefer-https-urls` exist to catch.
	// eslint-disable-next-line unicorn/prefer-https
	const insecureUrl = 'http://x.com';
	const leaves = [
		'',
		'.',
		'./a.js',
		'./a.d.ts',
		'./*',
		'MIT',
		'1.0.0',
		'v1.0.0',
		'^1.0.0',
		'~1.2',
		'*',
		'x',
		'latest',
		'https://x.com',
		insecureUrl,
		'ftp://x.com',
		'git+https://x.com/a/b.git',
		'github:u/r',
		'module',
		'commonjs',
		'npm@1.2.3',
		'pnpm@8',
		'npm:a@1',
		'workspace:*',
		'file:.',
		'file:../a',
		'darwin',
		'!win32',
		'x64',
		'man.1',
		'#a',
		'../x',
		'/abs',
		'node:fs',
		'@scope/pkg',
		'[a-z]',
		'{a,b}',
		'@(a|b)',
		'1 - 2',
		'1.x',
		String.raw`a\b`,
		true,
		false,
		null,
		0,
		1,
		-1,
	];

	const runSeed = seed => {
		const random = createRandom(seed);
		const pick = values => values[Math.floor(random() * values.length)];

		const build = depth => {
			const kind = depth <= 0 ? 'leaf' : pick(['leaf', 'object', 'array', 'object', 'array']);

			if (kind === 'leaf') {
				return pick(leaves);
			}

			if (kind === 'array') {
				return Array.from({length: Math.floor(random() * 4)}, () => build(depth - 1));
			}

			const value = {};
			for (let index = 0; index < Math.floor(random() * 4); index++) {
				value[pick([...fieldOrder, ...containerKeys])] = build(depth - 1);
			}

			return value;
		};

		for (let iteration = 0; iteration < 400; iteration++) {
			const document = {};
			for (let index = 0; index < 1 + Math.floor(random() * 5); index++) {
				document[pick(fieldOrder)] = build(3);
			}

			const code = JSON.stringify(document, undefined, '\t');
			const messages = linter.verify(code, config, {filename: 'package.json'});

			for (const message of messages) {
				const ruleId = message.ruleId?.replace('package-json/', '');
				assert.ok(!message.fatal, `a rule crashed on:\n${code}\n${message.message}`);
				assert.ok(ruleId, `missing rule id for: ${message.message}`);
				assert.ok(ruleIds.includes(ruleId), `unknown rule id ${message.ruleId}`);

				// A report must resolve to a declared message with every placeholder substituted.
				if (message.messageId) {
					assert.ok(Object.hasOwn(plugin.rules[ruleId].meta.messages, message.messageId), `${ruleId} reported undeclared messageId ${message.messageId}`);
				}

				assert.doesNotMatch(message.message, /\{\{\w+\}\}/u, `${ruleId} left a placeholder unsubstituted: ${message.message}`);

				// Every fix and suggestion this rule offers must leave the document valid JSON.
				const fixes = [
					...(message.fix ? [message.fix] : []),
					...(message.suggestions ?? []).map(suggestion => suggestion.fix),
				];
				for (const fix of fixes) {
					const [start, end] = fix.range;
					assert.ok(start >= 0, `${ruleId} produced a negative range start ${start}`);
					assert.ok(end >= start, `${ruleId} produced an inverted range ${start}-${end}`);
					assert.ok(end <= code.length, `${ruleId} produced a range past the end of the document ${end} > ${code.length}`);
					parseOrFail(code.slice(0, start) + fix.text + code.slice(end), `${message.ruleId} fix on:\n${code}`);
				}
			}
		}
	};

	for (const seed of [2027, 90_210, 8_675_309]) {
		runSeed(seed);
	}
});

/**
Collect every `package.json` under a directory, which for `node_modules` is a few hundred real-world manifests.
*/
const findManifests = (directory, depth = 4) => {
	if (depth === 0) {
		return [];
	}

	let entries;

	try {
		entries = fs.readdirSync(directory, {withFileTypes: true});
	} catch {
		return [];
	}

	return entries.flatMap(entry => {
		const entryPath = path.join(directory, entry.name);

		if (entry.isDirectory()) {
			return findManifests(entryPath, depth - 1);
		}

		return entry.name === 'package.json' ? [entryPath] : [];
	});
};

// Generated documents cover shapes nobody writes; the installed dependency tree covers shapes everybody writes. Real manifests are what caught `no-absolute-paths` calling `"files": ["/dist"]` an absolute path and `no-self-dependency` rejecting the `"file:."` self-link.
// Manifests shaped like real packages, each carrying a mistake that the installed dependency tree happens never to contain — published packages do not ship absolute paths, `EOVERRIDE` conflicts, or `workspace:` ranges. Without these, a third of the rules would only ever be exercised in isolation by their own tests, never alongside the others.
const unusualManifests = [
	['{"name":"a","version":"1.0.0","main":"C:/build/index.js","files":["dist"]}', 'package.json'],
	[String.raw`{"name":"a","version":"1.0.0","main":"dist\\index.js","files":["dist"]}`, 'package.json'],
	['{"name":"a","version":"1.0.0","dependencies":{"semver":"^7.0.0"},"devDependencies":{"semver":"^7.0.0"},"files":["dist"]}', 'package.json'],
	['{"name":"a","version":"1.0.0","dependencies":{"semver":"^7.0.0"},"devDependencies":{"semver":"^6.0.0"},"files":["dist"]}', 'package.json'],
	['{"name":"a","version":"1.0.0","peerDependencies":{"react":"18.2.0"},"files":["dist"]}', 'package.json'],
	['{"name":"a","version":"1.0.0","exports":{"./lib/":"./lib/"},"files":["lib"]}', 'package.json'],
	['{"name":"a","version":"1.0.0","exports":{".":["./index.js","./fallback.js"]},"files":["dist"]}', 'package.json'],
	// eslint-disable-next-line unicorn/prefer-https -- The insecure URL is the mistake `no-http-dependencies` exists to catch.
	['{"name":"a","version":"1.0.0","dependencies":{"foo":"http://example.com/foo.tgz"},"files":["dist"]}', 'package.json'],
	['{"name":"a","version":"1.0.0","dependencies":{"semver":"^7.0.0"},"overrides":{"semver":"^6.0.0"},"files":["dist"]}', 'package.json'],
	['{"name":"a","version":"1.0.0","dependencies":{"lodash":"^4.0.0"},"files":["dist"]}', 'package.json'],
	['{"name":"a","version":"1.0.0","browserify":{"a":1},"files":["dist"]}', 'package.json'],
	['{"name":"a","version":"1.0.0","dependencies":{"a":"^1.0.0"},"files":["dist"]}', 'package.json'],
	['{"name":"a","version":"1.0.0","dependencies":{"pkg-b":"workspace:*"},"files":["dist"]}', 'package.json'],
	['{"name":"a","version":"1.0.0","private":true,"publishConfig":{"access":"public"},"files":["dist"]}', 'package.json'],
	['{"name":"a","version":"1.0.0","engines":{"node":"^18.0.0"},"files":["dist"]}', 'package.json'],
	['{"name":"a","version":"1.0.0","dependencies":{"a":"file:."},"files":["dist"]}', 'package.json'],
	// `no-nested-exports` only fires for a package.json below the working directory, which the real-world corpus cannot produce because each manifest is linted from its own directory.
	['{"name":"a","version":"1.0.0","exports":{".":"./index.js"}}', 'sub/package.json'],
];

// The three option-driven rules report nothing at all until configured, so they need their options supplied to take part.
const optionDrivenRules = {
	'package-json/no-restricted-dependencies': ['error', {packages: ['lodash']}],
	'package-json/no-restricted-fields': ['error', {fields: ['browserify']}],
	'package-json/restrict-fields-when-private': ['error', {fields: ['publishConfig']}],
};

test('every rule takes part on a realistic manifest without breaking its neighbors', () => {
	const linter = new Linter();
	const config = [plugin.configs.all, {files: ['**/package.json'], rules: optionDrivenRules}];
	const fired = new Set();

	for (const [code, filename] of unusualManifests) {
		const messages = linter.verify(code, config, {filename});

		for (const message of messages) {
			assert.ok(!message.fatal, `a rule crashed on \`${code}\`: ${message.message}`);
			fired.add(withoutPrefix(message.ruleId));

			for (const suggestion of message.suggestions ?? []) {
				const {range, text} = suggestion.fix;
				parseOrFail(code.slice(0, range[0]) + text + code.slice(range[1]), `${message.ruleId} suggestion "${suggestion.desc}" on \`${code}\``);
			}
		}

		// Every rule runs at once here, so a fix that only works in isolation shows up as a broken or oscillating document.
		const {output, fixed} = linter.verifyAndFix(code, config, {filename});

		if (fixed) {
			parseOrFail(output, `fixing \`${code}\``);
			assert.equal(linter.verifyAndFix(output, config, {filename}).fixed, false, `fixing \`${code}\` did not converge`);
		}
	}

	// Rules the real-world corpus never reaches, so this is their only all-rules-together coverage. A rule dropping off this list means it went silent.
	const requiredToFire = [
		'no-absolute-paths',
		'no-backslash-paths',
		'no-duplicate-dependencies',
		'no-exact-peer-dependencies',
		'no-exports-trailing-slash',
		'no-fallback-export-arrays',
		'no-http-dependencies',
		'no-invalid-direct-overrides',
		'no-nested-exports',
		'no-restricted-dependencies',
		'no-restricted-fields',
		'no-self-dependency',
		'no-workspace-protocol-in-published-package',
		'prefer-engines-range',
		'restrict-fields-when-private',
	];

	assert.deepEqual(requiredToFire.filter(id => !fired.has(id)), [], 'these rules reported nothing on any manifest meant to trigger them');
});

test('no rule crashes or writes a broken fix on real-world manifests', () => {
	const config = [plugin.configs.all];
	const manifests = findManifests(path.resolve(import.meta.dirname, '../node_modules'));
	let checked = 0;

	for (const manifest of manifests) {
		let code;

		try {
			code = fs.readFileSync(manifest, 'utf8');
			JSON.parse(code);
		} catch {
			// A manifest this suite cannot parse is not this suite's problem.
			continue;
		}

		checked++;

		// The config matches `**/package.json` relative to cwd, and ESLint ignores `node_modules` by default, so each manifest is linted from inside its own directory.
		const linter = new Linter({cwd: path.dirname(manifest)});
		const options = {filename: 'package.json'};
		const messages = linter.verify(code, config, options);

		for (const message of messages) {
			assert.ok(!message.fatal, `a rule crashed on ${manifest}: ${message.message}`);

			for (const suggestion of message.suggestions ?? []) {
				const {range, text} = suggestion.fix;
				parseOrFail(code.slice(0, range[0]) + text + code.slice(range[1]), `${message.ruleId} suggestion "${suggestion.desc}" on ${manifest}`);
			}
		}

		const {output, fixed} = linter.verifyAndFix(code, config, options);

		if (fixed) {
			parseOrFail(output, `fixing ${manifest}`);
			// One `verify` answers whether another pass would change anything, where a second `verifyAndFix` would run up to ten of them.
			assert.ok(linter.verify(output, config, options).every(message => !message.fix), `fixing ${manifest} did not converge`);
		}
	}

	// Without dependencies installed there is nothing to check, and this test would pass by doing nothing at all.
	assert.ok(checked > 50, `expected to find real manifests to lint, checked only ${checked}`);
});

// Rules that ask what a manifest means traverse `withoutShadowedMembers` instead of the raw AST, so its view has to agree with `JSON.parse` on every shape — and cost nothing when there is nothing to collapse.
test('`withoutShadowedMembers` reproduces `JSON.parse` and leaves duplicate-free trees untouched', () => {
	const linter = new Linter();

	// Rebuild a plain value from the collapsed AST view, so it can be compared with the parsed document.
	const toPlainValue = node => {
		switch (node.type) {
			case 'Object': {
				return Object.fromEntries(node.members.map(member => [member.name.value, toPlainValue(member.value)]));
			}

			case 'Array': {
				return node.elements.map(element => toPlainValue(element.value));
			}

			default: {
				return node.value ?? null;
			}
		}
	};

	const hasDuplicateKey = node => {
		switch (node.type) {
			case 'Object': {
				const keys = node.members.map(member => member.name.value);
				return new Set(keys).size !== keys.length || node.members.some(member => hasDuplicateKey(member.value));
			}

			case 'Array': {
				return node.elements.some(element => hasDuplicateKey(element.value));
			}

			default: {
				return false;
			}
		}
	};

	const documents = [
		...trickyDocuments,
		'{"exports": {".": {"types": "./a.d.ts", "types": "./a.js"}}}',
		'{"exports": {".": ["./a.js", {"node": "./n.js", "node": "./m.js"}]}}',
		'{"exports": {"./a": 1, "./b": 2, "./a": 3}}',
		'{"a": {"b": {"c": {"d": 1, "d": 2}}}}',
		'{"a": [[{"b": 1, "b": 2}]]}',
	];

	for (const code of documents) {
		let root;
		const captureRule = {
			meta: {
				type: 'problem', schema: [], messages: {x: 'x'}, languages: ['json/json'],
			},
			create: () => ({
				Document(node) {
					root = node.body;
				},
			}),
		};

		linter.verify(code, ruleOnlyConfig('capture', captureRule), {filename: 'package.json'});

		const collapsed = withoutShadowedMembers(root);

		assert.deepEqual(toPlainValue(collapsed), JSON.parse(code), `the collapsed view of \`${code}\` disagrees with JSON.parse`);

		// Without duplicates the original node must come back untouched, which is what keeps this free for the documents people actually write.
		assert.equal(collapsed === root, !hasDuplicateKey(root), `\`${code}\` was ${hasDuplicateKey(root) ? 'not collapsed' : 'needlessly copied'}`);
	}
});

// `removeMembers` underpins every removal suggestion in the plugin, and its comma handling depends on which neighbors survive. Every rule only ever reaches a handful of those shapes, so they are covered exhaustively here instead.
test('`removeMembers` removes exactly the requested members, whatever the layout', () => {
	const linter = new Linter();
	const layouts = [
		members => `{${members.join(',')}}`,
		members => `{\n\t${members.join(',\n\t')}\n}`,
		members => `{ ${members.join(', ')} }`,
		members => `{\r\n\t${members.join(',\r\n\t')}\r\n}`,
		// A comma detached from its member, and an indent that is neither the first nor the last member's.
		members => `{${members.join(' ,\n   ')}}`,
	];

	// Every subset of `0..count - 1`, including the empty one and the full one.
	const indexSubsets = count => {
		let subsets = [[]];

		for (let index = 0; index < count; index++) {
			subsets = subsets.flatMap(subset => [subset, [...subset, index]]);
		}

		return subsets;
	};

	// A rule that removes the members at the given positions, so the fix can be applied and the result compared.
	const removalRule = removedIndexes => ({
		meta: {
			type: 'problem',
			fixable: 'code',
			schema: [],
			messages: {remove: 'Remove.'},
			languages: ['json/json'],
		},
		create: context => ({
			Document(node) {
				const root = node.body;
				const targets = root.members.filter((member, index) => removedIndexes.includes(index));

				context.report({
					node: root,
					messageId: 'remove',
					* fix(fixer) {
						yield * removeMembers(fixer, context.sourceCode, root, targets);
					},
				});
			},
		}),
	});

	for (let count = 1; count <= 5; count++) {
		const memberTexts = Array.from({length: count}, (_, index) => `"k${index}": ${index}`);

		for (const layout of layouts) {
			const code = layout(memberTexts);

			for (const removedIndexes of indexSubsets(count)) {
				const [message] = linter.verify(code, ruleOnlyConfig('remove', removalRule(removedIndexes)), {filename: 'package.json'});
				// An empty selection yields no fix at all, which must leave the document untouched.
				const output = message.fix
					? code.slice(0, message.fix.range[0]) + message.fix.text + code.slice(message.fix.range[1])
					: code;
				const expected = Object.fromEntries(memberTexts
					.map((_, index) => index)
					.filter(index => !removedIndexes.includes(index))
					.map(index => [`k${index}`, index]));
				const description = `removing [${removedIndexes.join(', ')}] from \`${code}\``;

				assert.deepEqual(parseOrFail(output, description), expected, `${description} produced \`${output}\``);
			}
		}
	}
});

/**
Lint with one rule under one options object, describing how it went wrong, or `undefined` when it behaved.

ESLint rejecting a schema-invalid option is correct, and a rule refusing an option it cannot use is fine too — as long as it says which option and why, rather than letting a raw `RegExp` or `JSON` error escape.
*/
const getOptionFailure = (linter, code, id, options) => {
	let messages;

	try {
		messages = linter.verify(code, {
			files: ['**/package.json'],
			language: 'json/json',
			plugins: {json, 'rule-to-test': {rules: {[id]: plugin.rules[id]}}},
			rules: {[`rule-to-test/${id}`]: ['error', options]},
		}, {filename: 'package.json'});
	} catch (error) {
		return /should NOT|must NOT|Value |should be|must be|option of/u.test(error.message)
			? undefined
			: `failed without explaining itself: ${error.message}`;
	}

	return messages.every(message => !message.fatal) ? undefined : 'crashed the rule';
};

// Options are user input, and a value the schema accepts can still break a rule. `no-orphan-script-hooks` compiles its `ignore` entries with `RegExp`, so a glob typed where a regular expression belongs used to abort the whole lint run with an unattributed error.
test('no rule breaks on an option its schema accepts', () => {
	const linter = new Linter();
	const code = '{"name":"foo","version":"1.0.0","scripts":{"prebuild":"x"},"dependencies":{"a":"^1.0.0"},"files":["dist"],"engines":{"node":">=18"}}';
	// Regular expression metacharacters, empty and whitespace strings, and the odd types a loose `items` schema still admits.
	const awkwardValues = ['', '[', '(', '\\', '*', '+', '?', 'a{2,', '.*', '^$', ' ', '$&', 'a'.repeat(200)];

	for (const id of ruleIds) {
		const [schema] = plugin.rules[id].meta.schema;

		for (const [key, property] of Object.entries(schema?.properties ?? {})) {
			const candidates = [];

			if (property.type === 'array') {
				candidates.push([], ...awkwardValues.map(value => [value]));
			} else if (property.type === 'boolean') {
				candidates.push(true, false);
			} else if (property.enum) {
				candidates.push(...property.enum);
			}

			for (const value of candidates) {
				const options = {[key]: value};
				const failure = getOptionFailure(linter, code, id, options);

				assert.equal(failure, undefined, `${id} with ${JSON.stringify(options)} ${failure}`);
			}
		}
	}
});

test('no rule crashes on a non-object or unusual root', () => {
	const linter = new Linter();
	const roots = ['[]', '"string"', '42', 'true', 'null', '{}'];

	for (const id of ruleIds) {
		for (const code of roots) {
			const messages = linter.verify(code, ruleOnlyConfig(id), {filename: 'package.json'});

			const fatal = messages.find(message => message.fatal);
			assert.ok(!fatal, `${id} crashed on \`${code}\`: ${fatal?.message}`);
		}
	}
});
