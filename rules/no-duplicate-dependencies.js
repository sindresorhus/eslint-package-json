import {
	getRootObject,
	countEffectiveMembers,
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
//
// The order is the precedence a consumer of the published package sees, and the first group to list a name keeps it, so a duplicate is reported against, and removed from, a later group. A consumer never installs `devDependencies` (Arborist loads them only for the project root), so they come last. Arborist loads `optionalDependencies` after `dependencies` and lets it win, so the optional entry is the one npm installs, which is why `fsevents` is kept there.
const exclusiveGroups = ['optionalDependencies', 'dependencies', 'devDependencies'];

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
						// Across groups, removing a `devDependencies` entry changes an install: the project root loads `devDependencies` last and lets them win, so `npm install --omit=dev` skips a name listed in both, and keeping only the `dependencies` entry installs it. Removing a `dependencies` entry in favor of the `optionalDependencies` one installs the same thing, but whether the package is required or optional is the author's call. So every cross-group removal is a suggestion, and only a same-group one an automatic fix.
						const isAutofix = isSafeToFix && isSameGroup;

						// Removing the name takes the whole run with it, so a group that held nothing else is left empty, which `no-empty-fields` then reports as a problem this fix created; the group itself goes instead. A same-group removal always leaves its effective entry, so only the cross-group one can empty a group.
						const doesEmptyTheGroup = !isSameGroup && countEffectiveMembers(group.value) === 1;

						const removal = {
							* fix(fixer) {
								if (isSameGroup) {
									// Within a group the effective member takes the whole shadowed run with it, which resolves the report. A duplicate that only shadows another needs no more than the member the report names.
									yield * (isSafeToFix
										? removeShadowedDuplicates(fixer, sourceCode, effectiveMember)
										: removeMember(fixer, sourceCode, member));
									return;
								}

								// Across groups the whole name goes, and with it every member in the group that shares it, so the report is resolved whether the member it names is the effective one or only shadows another.
								if (doesEmptyTheGroup) {
									// The group member is the one `findMember` resolved, which is the final member for its key. Taking the whole run is what keeps a shadowed duplicate from being promoted into the group's place, which would bring this report back.
									yield * removeMemberAndDuplicates(fixer, sourceCode, group);
									return;
								}

								yield * removeMemberAndDuplicates(fixer, sourceCode, member);
							},
						};

						context.report({
							node: member.name,
							messageId: MESSAGE_ID,
							data: {name, group: first.groupName},
							...(isAutofix
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
