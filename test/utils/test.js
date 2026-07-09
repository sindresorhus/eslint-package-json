import path from 'node:path';
import url from 'node:url';
import plugin from '../../index.js';
import SnapshotRuleTester from './snapshot-rule-tester.js';

const only = testCase =>
	typeof testCase === 'string'
		? {code: testCase, only: true}
		: {...testCase, only: true};

function getTester(importMeta) {
	const filename = url.fileURLToPath(importMeta.url);
	const ruleId = path.basename(filename, '.js');
	const rule = plugin.rules[ruleId];

	if (!rule) {
		throw new Error(`Could not find rule \`${ruleId}\`. Did you forget to regenerate \`rules/index.js\`?`);
	}

	const tester = new SnapshotRuleTester();

	const run = {
		snapshot: tests => tester.run(ruleId, rule, tests),
		only,
	};

	return {
		ruleId,
		rule,
		test: run,
	};
}

export {getTester};
