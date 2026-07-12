import semver from 'semver';
import {
	getRootObject,
	findMember,
	getKey,
	getNewline,
	lineIndentOf,
	removeMember,
} from './utils/index.js';

const MESSAGE_ID = 'no-package-manager-engines';
const REMOVE_SUGGESTION_ID = 'remove';
const MIGRATION_SUGGESTION_ID = 'migrate';

const messages = {
	[MESSAGE_ID]: 'Specify the `{{manager}}` version in the `packageManager` field (with Corepack) instead of `engines`.',
	[REMOVE_SUGGESTION_ID]: 'Remove the engine.',
	[MIGRATION_SUGGESTION_ID]: 'Set `packageManager` to `{{packageManager}}`.',
};

const packageManagers = new Set(['npm', 'yarn', 'pnpm', 'bun']);

const hasLowerBound = comparators => comparators.some(comparator => ['>=', '>'].includes(comparator.operator) || (comparator.operator === '' && comparator.value !== ''));

const getMinimumVersion = value => {
	let range;

	try {
		range = new semver.Range(value);
	} catch {
		return;
	}

	// A packageManager value must be inferred from every alternative in the range. Wildcards and upper-bound-only ranges do not provide a useful version to pin.
	if (range.set.some(comparators => !hasLowerBound(comparators))) {
		return;
	}

	return semver.minVersion(range)?.version;
};

function * migrateToPackageManager(fixer, sourceCode, {engines, member, packageManagerValue}) {
	const lineStart = sourceCode.text.lastIndexOf('\n', engines.range[0] - 1) + 1;
	const memberPrefix = sourceCode.text.slice(lineStart, engines.range[0]);
	const separator = memberPrefix.trim() === ''
		? `,${getNewline(sourceCode)}${lineIndentOf(sourceCode, engines)}`
		: ', ';

	yield fixer.insertTextAfter(engines, `${separator}"packageManager": ${JSON.stringify(packageManagerValue)}`);
	yield * removeMember(fixer, sourceCode, member);
}

/** @param {import('eslint').Rule.RuleContext} context */
const create = context => ({
	Document(node) {
		const root = getRootObject(node);

		if (!root) {
			return;
		}

		const engines = findMember(root, 'engines');

		if (engines?.value.type !== 'Object') {
			return;
		}

		const {sourceCode} = context;
		const packageManagerMember = findMember(root, 'packageManager');
		const packageManagerEngineMembers = engines.value.members.filter(member => packageManagers.has(getKey(member)));
		const canMigrate = !packageManagerMember && packageManagerEngineMembers.length === 1;

		for (const member of engines.value.members) {
			const manager = getKey(member);

			if (!packageManagers.has(manager)) {
				continue;
			}

			const suggest = [
				{
					messageId: REMOVE_SUGGESTION_ID,
					* fix(fixer) {
						yield * removeMember(fixer, sourceCode, member);
					},
				},
			];

			if (canMigrate && member.value.type === 'String') {
				const version = getMinimumVersion(member.value.value);

				if (version) {
					const packageManagerValue = `${manager}@${version}`;

					suggest.push({
						messageId: MIGRATION_SUGGESTION_ID,
						data: {packageManager: packageManagerValue},
						* fix(fixer) {
							yield * migrateToPackageManager(fixer, sourceCode, {
								engines,
								member,
								packageManagerValue,
							});
						},
					});
				}
			}

			context.report({
				node: member.name,
				messageId: MESSAGE_ID,
				data: {manager},
				suggest,
			});
		}
	},
});

/** @type {import('eslint').Rule.RuleModule} */
const config = {
	create,
	meta: {
		type: 'suggestion',
		docs: {
			description: 'Disallow package manager versions in the `engines` field.',
			recommended: true,
		},
		hasSuggestions: true,
		schema: [],
		messages,
		languages: ['json/json'],
	},
};

export default config;
