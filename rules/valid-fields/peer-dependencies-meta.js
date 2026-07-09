import {
	findMember,
	getKey,
	removeMember,
} from '../utils/index.js';

const MESSAGE_ID = 'valid-peer-dependencies-meta';
const SUGGESTION_ID = 'remove';

export const messages = {
	[MESSAGE_ID]: '`{{name}}` is in `peerDependenciesMeta` but not in `peerDependencies`.',
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

	for (const member of meta.value.members) {
		const name = getKey(member);

		if (peers.has(name)) {
			continue;
		}

		yield {
			node: member.name,
			messageId: MESSAGE_ID,
			data: {name},
			suggest: [
				{
					messageId: SUGGESTION_ID,
					* fix(fixer) {
						yield * removeMember(fixer, sourceCode, member);
					},
				},
			],
		};
	}
}
