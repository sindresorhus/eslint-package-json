/* eslint-disable unicorn/no-top-level-side-effects, node-test/no-conditional-assertion, node-test/no-export -- This is a reusable snapshot-test harness: it configures the snapshot system at module load, asserts per message and suggestion inside loops, and exports the tester for spec files to import. */
import path from 'node:path';
import {inspect} from 'node:util';
import test, {snapshot} from 'node:test';
import assert from 'node:assert/strict';
import {codeFrameColumns} from '@babel/code-frame';
import {Linter} from 'eslint';
import json from '@eslint/json';
import outdent from 'outdent';
import * as YAML from 'yaml';

// Store snapshots verbatim (we pre-format them as code frames) instead of `util.inspect` output.
snapshot.setDefaultSnapshotSerializers([value => value]);

// Keep snapshots together in `test/snapshots/<file>.snapshot`.
snapshot.setResolveSnapshotPath(testPath => {
	const {dir, base} = path.parse(testPath);
	return path.join(dir, 'snapshots', `${base}.snapshot`);
});

const isPlainObject = value => value && Object.getPrototypeOf(value) === Object.prototype;

function serializeOptions(value) {
	return YAML.stringify(
		value,
		(key, value) => {
			if (
				Array.isArray(value)
				|| isPlainObject(value)
				|| typeof value === 'boolean'
				|| typeof value === 'number'
				|| typeof value === 'string'
				|| value === null
			) {
				return value;
			}

			throw new Error('Unsupported value');
		},
		{
			defaultKeyType: 'PLAIN',
			defaultStringType: 'QUOTE_SINGLE',
		},
	)
		.trimEnd();
}

// A simple version of `SourceCodeFixer.applyFixes`
// https://github.com/eslint/eslint/issues/14936#issuecomment-906746754
const applyFix = (code, {fix}) => `${code.slice(0, fix.range[0])}${fix.text}${code.slice(fix.range[1])}`;
const codeFrameColumnsOptions = {linesAbove: Infinity, linesBelow: Infinity};

function visualizeRange(text, location, message) {
	return codeFrameColumns(
		text,
		location,
		{
			...codeFrameColumnsOptions,
			message,
		},
	);
}

function visualizeEslintMessage(text, result) {
	const {line, column, endLine, endColumn, message} = result;
	const location = {
		start: {
			line,
			column: Math.max(0, column - 1),
		},
	};

	if (typeof endLine === 'number' && typeof endColumn === 'number') {
		location.end = {
			line: endLine,
			column: Math.max(0, endColumn - 1),
		};
	}

	return visualizeRange(text, location, message);
}

const printCode = code => codeFrameColumns(code, {start: {line: 0, column: 0}}, codeFrameColumnsOptions);
const getAdditionalProperties = (object, properties) =>
	Object.keys(object).filter(property => !properties.includes(property));

function normalizeTests(tests) {
	const additionalProperties = getAdditionalProperties(tests, ['valid', 'invalid']);
	if (additionalProperties.length > 0) {
		throw new Error(`Unexpected snapshot test properties: ${additionalProperties.join(', ')}`);
	}

	for (const type of ['valid', 'invalid']) {
		const cases = tests[type];

		for (const [index, testCase] of cases.entries()) {
			if (typeof testCase === 'string') {
				cases[index] = {code: testCase};
			} else {
				const additionalProperties = getAdditionalProperties(
					testCase,
					['code', 'options', 'filename', 'language', 'only'],
				);

				if (additionalProperties.length > 0) {
					throw new Error(`Unexpected ${type} snapshot test case properties: ${additionalProperties.join(', ')}`);
				}
			}
		}
	}

	return tests;
}

function getVerifyConfig(ruleId, rule, testCase) {
	const {options = [], language = 'json/json'} = testCase;
	const pluginName = 'rule-to-test';

	return {
		files: ['**'],
		language,
		plugins: {
			json,
			[pluginName]: {
				rules: {
					[ruleId]: rule,
				},
			},
		},
		rules: {
			[`${pluginName}/${ruleId}`]: ['error', ...options],
		},
		linterOptions: {
			reportUnusedDisableDirectives: 'off',
		},
	};
}

function verify(code, verifyConfig, {filename}) {
	const linter = new Linter();
	const messages = linter.verify(code, verifyConfig, {filename});

	const invalidMessage = messages.find(({message}) => typeof message !== 'string');
	if (invalidMessage) {
		throw Object.assign(new Error('Unexpected message.'), {eslintMessage: invalidMessage});
	}

	const fatalError = messages.find(({fatal}) => fatal);
	if (fatalError) {
		const {line, column, message} = fatalError;
		throw new SyntaxError('\n' + codeFrameColumns(code, {start: {line, column: Math.max(0, column - 1)}}, {message}));
	}

	return messages;
}

function runValidCase(ruleId, rule, testCase, index) {
	const {code: input, filename = 'package.json', only} = testCase;
	const verifyConfig = getVerifyConfig(ruleId, rule, testCase);

	test(`valid(${index + 1}): ${input}`, only ? {only: true} : {}, () => {
		const messages = verify(input, verifyConfig, {filename});
		assert.deepEqual(messages, [], 'Valid case should not have errors.');
	});
}

function runInvalidCase(ruleId, rule, testCase, index) {
	const {fixable} = rule.meta;
	const {code: input, options, filename = 'package.json', only} = testCase;
	const verifyConfig = getVerifyConfig(ruleId, rule, testCase);
	const runVerify = code => verify(code, verifyConfig, {filename});

	test(`invalid(${index + 1}): ${input}`, only ? {only: true} : {}, t => {
		const messages = runVerify(input);

		t.assert.notDeepStrictEqual(messages, [], 'Invalid case should have at least one error.');

		const inputSnapshotParts = [];
		let shouldPrintCodeHead = false;

		if (Array.isArray(options)) {
			inputSnapshotParts.push(outdent`
				Options:
				${serializeOptions(options)}
			`);
			shouldPrintCodeHead = true;
		}

		inputSnapshotParts.push(shouldPrintCodeHead
			? outdent`
				Code:
				${printCode(input)}
			`
			: printCode(input));

		const inputHeader = 'Input' + (filename === 'package.json' ? '' : ` ${inspect(filename)}`);
		t.assert.snapshot(`\n[${inputHeader}]\n${inputSnapshotParts.join('\n\n')}\n`);

		for (const message of messages) {
			const snapshotParts = [
				outdent`
					Message:
					${visualizeEslintMessage(input, message)}
				`,
			];

			if (fixable && message.fix) {
				const output = applyFix(input, message);
				if (output !== input) {
					runVerify(output);

					snapshotParts.push(outdent`
						Output:
						${printCode(output)}
					`);
				}
			}

			const {suggestions = []} = message;

			for (const [index, suggestion] of suggestions.entries()) {
				const output = applyFix(input, suggestion);
				t.assert.notStrictEqual(output, input, 'Suggestion should provide different output.');

				runVerify(output);

				snapshotParts.push(outdent`
					Suggestion ${index + 1}/${suggestions.length}: ${suggestion.desc}:
					${printCode(output)}
				`);
			}

			t.assert.snapshot(`\n${snapshotParts.join('\n\n')}\n`);
		}
	});
}

export default class SnapshotRuleTester {
	run(ruleId, rule, tests) {
		const {valid, invalid} = normalizeTests(tests);

		for (const [index, testCase] of valid.entries()) {
			runValidCase(ruleId, rule, testCase, index);
		}

		for (const [index, testCase] of invalid.entries()) {
			runInvalidCase(ruleId, rule, testCase, index);
		}
	}
}
export {visualizeEslintMessage};
