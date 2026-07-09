import {
	getRootObject,
	iterateDependencies,
	findMember,
	removeMember,
	insertGroupMember,
	optionsSchema,
	stringArraySchema,
} from './utils/index.js';

const MESSAGE_ID = 'types-in-dev-dependencies';
const SUGGESTION_ID = 'move';

const messages = {
	[MESSAGE_ID]: '`{{name}}` should be in `devDependencies`, not `{{group}}`.',
	[SUGGESTION_ID]: 'Move to `devDependencies`.',
};

// `peerDependencies` is intentionally excluded: a library may legitimately expose types from a peer.
const runtimeGroups = ['dependencies', 'optionalDependencies'];

/** @param {import('eslint').Rule.RuleContext} context */
const create = context => {
	const {sourceCode} = context;
	const {ignore = []} = context.options[0] ?? {};

	return {
		Document(node) {
			const root = getRootObject(node);

			if (!root) {
				return;
			}

			const devDependenciesGroup = findMember(root, 'devDependencies');

			for (const {groupName, member, name} of iterateDependencies(root, runtimeGroups)) {
				if (!name.startsWith('@types/') || ignore.includes(name)) {
					continue;
				}

				// Only offer a fix for a well-formed range, when `devDependencies` doesn't already have this package (a conflicting version is ambiguous to resolve) and is absent or a well-formed object.
				const canFix = member.value.type === 'String'
					&& (!devDependenciesGroup || devDependenciesGroup.value.type === 'Object')
					&& !(devDependenciesGroup?.value.type === 'Object' && findMember(devDependenciesGroup.value, name));

				context.report({
					node: member.name,
					messageId: MESSAGE_ID,
					data: {name, group: groupName},
					suggest: canFix
						? [
							{
								messageId: SUGGESTION_ID,
								* fix(fixer) {
									yield * removeMember(fixer, sourceCode, member);
									yield * insertGroupMember(fixer, sourceCode, root, {
										groupMember: devDependenciesGroup,
										groupName: 'devDependencies',
										key: name,
										value: JSON.stringify(member.value.value),
									});
								},
							},
						]
						: [],
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
			description: 'Enforce `@types/*` packages to be in `devDependencies`.',
			recommended: false,
		},
		hasSuggestions: true,
		schema: optionsSchema({ignore: stringArraySchema}),
		messages,
		languages: ['json/json'],
	},
};

export default config;
