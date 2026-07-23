import {
	getRootObject,
	findMember,
	getKey,
	removeMember,
	removeMemberAndDuplicates,
	removeShadowedDuplicates,
} from './utils/index.js';

const MESSAGE_ID = 'no-duplicate-dependencies';
const SUGGESTION_ID = 'remove';

const messages = {
	[MESSAGE_ID]: '`{{name}}` is already listed in `{{group}}`.',
	[SUGGESTION_ID]: 'Remove the duplicate `{{name}}` from `{{group}}`.',
};

const hasSameSpecifier = (sourceCode, firstMember, secondMember) => {
	if (firstMember.value.type !== secondMember.value.type) {
		return false;
	}

	return firstMember.value.type === 'String'
		? firstMember.value.value === secondMember.value.value
		: sourceCode.getText(firstMember.value) === sourceCode.getText(secondMember.value);
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
					const first = seen.get(name);

					if (first) {
						const isSameGroup = first.groupName === groupName;
						const effectiveMember = findMember(group.value, name);
						const isEffectiveMember = effectiveMember === member;
						// What would answer for this name once `member` is gone: within a group the duplicate it shadows, across groups the group that claimed the name first.
						const successor = isSameGroup
							? group.value.members.findLast(candidate => candidate !== member && getKey(candidate) === name)
							: first.effectiveMember;

						// Within a group, the effective member removes the whole shadowed run. This keeps same-group fixes in one range and only does so when the effective value agrees with the duplicate it follows. Across groups the whole key goes, so removing the effective member is safe only when its successor asks for the same specifier.
						const isSafeToFix = isEffectiveMember && hasSameSpecifier(sourceCode, member, successor);

						// Across groups the whole key goes, so an earlier duplicate must not be promoted into its place.
						const shouldRemoveDuplicates = !isSameGroup && isSafeToFix;

						const removal = {
							* fix(fixer) {
								if (isSameGroup && isSafeToFix) {
									yield * removeShadowedDuplicates(fixer, sourceCode, effectiveMember);
									return;
								}

								if (shouldRemoveDuplicates) {
									yield * removeMemberAndDuplicates(fixer, sourceCode, member);
									return;
								}

								yield * removeMember(fixer, sourceCode, member);
							},
						};

						context.report({
							node: member.name,
							messageId: MESSAGE_ID,
							data: {name, group: first.groupName},
							...(isSafeToFix
								? removal
								: {suggest: [{messageId: SUGGESTION_ID, data: {name, group: groupName}, ...removal}]}),
						});
					} else {
						seen.set(name, {groupName, effectiveMember: findMember(group.value, name)});
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
		hasSuggestions: true,
		schema: [],
		messages,
		languages: ['json/json'],
	},
};

export default config;
