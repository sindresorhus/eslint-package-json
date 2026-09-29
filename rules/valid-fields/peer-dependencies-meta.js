import {
	findMember,
	getKey,
	iterateEffectiveMembers,
	removeEntryAndEmptyContainer,
	removeMemberAndDuplicates,
} from '../utils/index.js';

const MESSAGE_ID = 'valid-peer-dependencies-meta';
const REDUNDANT_OPTIONAL_MESSAGE_ID = 'redundantOptional';
const SUGGESTION_ID = 'remove';

export const messages = {
	[MESSAGE_ID]: '`{{name}}` is in `peerDependenciesMeta` but not in `peerDependencies`.',
	[REDUNDANT_OPTIONAL_MESSAGE_ID]: '`peerDependenciesMeta.{{name}}.optional` is redundant because `false` is the default.',
	[SUGGESTION_ID]: 'Remove the orphaned entry.',
};

export function * check(root, context) {
	const {sourceCode} = context;

	const meta = findMember(root, 'peerDependenciesMeta');

	if (meta?.value.type !== 'Object') {
		return;
	}

	const peerDependencies = findMember(root, 'peerDependencies');
	const peers = new Set(peerDependencies?.value.type === 'Object'
		? peerDependencies.value.members.map(member => getKey(member))
		: []);

	// Effective members, since whether an entry is orphaned depends on the value npm reads, and a shadowed duplicate is not one. Removing an effective entry then has to take its duplicates too, or one would be promoted into its place.
	for (const member of iterateEffectiveMembers(meta.value)) {
		const name = getKey(member);
		const optional = member.value.type === 'Object' ? findMember(member.value, 'optional') : undefined;

		// An optional peer declared only here is how a package declares a peer it can use but does not require (`@types/react` beside `react`, `supports-color` in `debug`): pnpm and Yarn honor it, and npm's `linked` install strategy resolves it from the tree and links it, so it is not orphaned.
		if (!peers.has(name) && !(optional?.value.type === 'Boolean' && optional.value.value)) {
			yield {
				node: member.name,
				messageId: MESSAGE_ID,
				data: {name},
				suggest: [
					{
						messageId: SUGGESTION_ID,
						* fix(fixer) {
							yield * removeEntryAndEmptyContainer(fixer, sourceCode, meta, member);
						},
					},
				],
			};
		}

		if (optional?.value.type === 'Boolean' && optional.value.value === false) {
			yield {
				node: optional.name,
				messageId: REDUNDANT_OPTIONAL_MESSAGE_ID,
				data: {name},
				* fix(fixer) {
					yield * removeMemberAndDuplicates(fixer, sourceCode, optional);
				},
			};
		}
	}
}
