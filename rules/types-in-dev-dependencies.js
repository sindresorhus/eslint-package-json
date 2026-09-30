import {
	countEffectiveMembers,
	getRootObject,
	iterateDependencies,
	findMember,
	removeMemberAndDuplicates,
	removeShadowedDuplicates,
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

			// A manifest that is itself a type package declares the types its own declaration file imports, and a consumer receives those from `dependencies` alone, because npm installs no devDependency of a dependency. `@types/debug` depends on `@types/ms` for exactly this reason.
			const ownName = findMember(root, 'name');

			if (ownName?.value.type === 'String' && ownName.value.value.startsWith('@types/')) {
				return;
			}

			const devDependenciesGroup = findMember(root, 'devDependencies');

			for (const {group, groupName, member, name} of iterateDependencies(root, runtimeGroups)) {
				if (!name.startsWith('@types/') || ignore.includes(name)) {
					continue;
				}

				// An entry already in `devDependencies` at the same range means the move is half done, so the fix only has to take it out of the group it does not belong in. A different range there is ambiguous to resolve, since either group could be the one holding the wrong version.
				const existing = devDependenciesGroup?.value.type === 'Object' ? findMember(devDependenciesGroup.value, name) : undefined;
				const isAlreadyMoved = member.value.type === 'String'
					&& existing?.value.type === 'String'
					&& existing.value.value === member.value.value;

				// Only offer a fix for a well-formed range in a group that is absent or a well-formed object.
				const canFix = member.value.type === 'String'
					&& (!devDependenciesGroup || devDependenciesGroup.value.type === 'Object')
					&& (existing === undefined || isAlreadyMoved);

				// Moving the last entry out would leave an empty group behind, which `no-empty-fields` then reports as a problem this suggestion created, so the group is renamed to `devDependencies` rather than removed and recreated: two fixes that touch the same span cannot both apply. The test is the effective member count, since a shadowed duplicate is the entry the move takes with it: a group whose only key is written twice still has nothing left once the entry goes.
				const isTheOnlyMember = countEffectiveMembers(group.value) === 1;

				context.report({
					node: member.name,
					messageId: MESSAGE_ID,
					data: {name, group: groupName},
					suggest: canFix
						? [
							{
								messageId: SUGGESTION_ID,
								* fix(fixer) {
									// With no `devDependencies` group to move the entry into, the group that is left empty is renamed instead: removing it and creating another one at the same span would be two fixes that cannot both apply, and the entry moves with the key either way. The earlier duplicates of the group go, or the first of them would take its place under the old key.
									if (isTheOnlyMember && !devDependenciesGroup) {
										yield * removeShadowedDuplicates(fixer, sourceCode, group);
										yield fixer.replaceText(group.name, JSON.stringify('devDependencies'));
										return;
									}

									// The group is the one `findMember` resolved, so the member that goes is the final one for its key. Taking the whole run keeps a shadowed duplicate from being promoted into the group's place, which brings this report back.
									yield * removeMemberAndDuplicates(fixer, sourceCode, isTheOnlyMember ? group : member);

									if (isAlreadyMoved) {
										return;
									}

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
