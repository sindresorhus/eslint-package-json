import {
	getRootObject,
	findMember,
	getKey,
	removeMember,
} from './utils/index.js';

const MESSAGE_ID = 'no-duplicate-dependencies';

const messages = {
	[MESSAGE_ID]: '`{{name}}` is already listed in `{{group}}`.',
};

// A package cannot meaningfully be in more than one of these groups.
// `peerDependencies` is intentionally excluded, since also listing a peer in
// `devDependencies` is a common and valid pattern.
const exclusiveGroups = ['dependencies', 'devDependencies', 'optionalDependencies'];

/** @param {import('eslint').Rule.RuleContext} context */
const create = context => {
	const {sourceCode} = context;

	return {
		Document(node) {
			const root = getRootObject(node);

			if (!root) {
				return;
			}

			const seen = new Map();

			for (const groupName of exclusiveGroups) {
				const group = findMember(root, groupName);

				if (group?.value.type !== 'Object') {
					continue;
				}

				for (const member of group.value.members) {
					const name = getKey(member);
					const firstGroup = seen.get(name);

					if (firstGroup) {
						context.report({
							node: member.name,
							messageId: MESSAGE_ID,
							data: {name, group: firstGroup},
							* fix(fixer) {
								yield * removeMember(fixer, sourceCode, member);
							},
						});
					} else {
						seen.set(name, groupName);
					}
				}
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
			description: 'Disallow a dependency listed in multiple dependency groups.',
			recommended: true,
		},
		fixable: 'code',
		schema: [],
		messages,
		languages: ['json/json'],
	},
};

export default config;
