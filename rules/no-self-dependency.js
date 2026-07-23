import npa from 'npm-package-arg';
import {
	getRootObject,
	findMember,
	iterateDependencies,
	removeMemberAndDuplicates,
} from './utils/index.js';

const MESSAGE_ID = 'no-self-dependency';
const SUGGESTION_ID = 'remove';

const messages = {
	[MESSAGE_ID]: 'A package cannot list itself (`{{name}}`) as a dependency.',
	[SUGGESTION_ID]: 'Remove the self-dependency.',
};

// Self-hosting lives in `devDependencies`: TypeScript compiles itself with a published TypeScript, and an ESLint plugin lints itself with its own last release. Those are deliberate, so only the groups where a self-reference has no use are checked.
const checkedDependencyTypes = ['dependencies', 'optionalDependencies', 'peerDependencies'];

// Only a specifier npm resolves by name from the registry is the accidental self-reference: npm happily installs whatever unrelated package holds that name. A local path (`file:.`) is instead the deliberate self-link that lets a package dogfood its own published entry points, which `eslint` and `xo` both ship. Anything else — a git or tarball URL, or a yarn/pnpm protocol `npm-package-arg` cannot parse — is a deliberate choice this rule has no business second-guessing.
const registryTypes = new Set(['version', 'range', 'tag']);

const isResolvedFromRegistry = (name, specifier) => {
	try {
		const parsed = npa.resolve(name, specifier);

		return registryTypes.has(parsed.type)
			|| (parsed.type === 'alias' && parsed.subSpec?.name === name && registryTypes.has(parsed.subSpec.type));
	} catch {
		return false;
	}
};

/** @param {import('eslint').Rule.RuleContext} context */
const create = context => {
	const {sourceCode} = context;

	return {
		Document(node) {
			const root = getRootObject(node);

			if (!root) {
				return;
			}

			const nameMember = findMember(root, 'name');

			if (nameMember?.value.type !== 'String') {
				return;
			}

			const packageName = nameMember.value.value;

			for (const {member, name} of iterateDependencies(root, checkedDependencyTypes)) {
				if (
					name !== packageName
					|| member.value.type !== 'String'
					|| !isResolvedFromRegistry(name, member.value.value)
				) {
					continue;
				}

				context.report({
					node: member.name,
					messageId: MESSAGE_ID,
					data: {name},
					suggest: [
						{
							messageId: SUGGESTION_ID,
							* fix(fixer) {
								yield * removeMemberAndDuplicates(fixer, sourceCode, member);
							},
						},
					],
				});
			}
		},
	};
};

/** @type {import('eslint').Rule.RuleModule} */
const config = {
	create,
	meta: {
		type: 'problem',
		docs: {
			description: 'Disallow a package depending on itself.',
			recommended: true,
		},
		hasSuggestions: true,
		schema: [],
		messages,
		languages: ['json/json'],
	},
};

export default config;
