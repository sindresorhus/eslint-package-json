import semver from 'semver';
import {
	getRootObject,
	getKey,
	findMember,
	insertGroupMember,
	validRange,
} from './utils/index.js';

const MISSING_MESSAGE_ID = 'missing';
const MISMATCH_MESSAGE_ID = 'mismatch';
const ADD_SUGGESTION_ID = 'add';
const ALIGN_SUGGESTION_ID = 'align';

const messages = {
	[MISSING_MESSAGE_ID]: 'Peer dependency `{{name}}` should also be listed in `devDependencies`.',
	[MISMATCH_MESSAGE_ID]: 'The `devDependencies` version of `{{name}}` (`{{devRange}}`) does not satisfy the `peerDependencies` range (`{{peerRange}}`).',
	[ADD_SUGGESTION_ID]: 'Add `{{name}}` to `devDependencies` at `{{range}}`.',
	[ALIGN_SUGGESTION_ID]: 'Set the `devDependencies` range to `{{range}}`.',
};

/**
Get the names marked `optional: true` in a `peerDependenciesMeta` object.
*/
function getOptionalPeers(root) {
	const peerDependenciesMetaGroup = findMember(root, 'peerDependenciesMeta');
	const optionalPeers = new Set();

	if (peerDependenciesMetaGroup?.value.type !== 'Object') {
		return optionalPeers;
	}

	for (const member of peerDependenciesMetaGroup.value.members) {
		const optionalMember = member.value.type === 'Object' && findMember(member.value, 'optional');

		if (optionalMember?.value.type === 'Boolean' && optionalMember.value.value === true) {
			optionalPeers.add(getKey(member));
		}
	}

	return optionalPeers;
}

/** @param {import('eslint').Rule.RuleContext} context */
const create = context => {
	const {sourceCode} = context;

	return {
		Document(node) {
			const root = getRootObject(node);

			if (!root) {
				return;
			}

			const peerDependenciesGroup = findMember(root, 'peerDependencies');

			if (peerDependenciesGroup?.value.type !== 'Object') {
				return;
			}

			const devDependenciesGroup = findMember(root, 'devDependencies');
			const devDependencies = new Map(devDependenciesGroup?.value.type === 'Object'
				? devDependenciesGroup.value.members.map(member => [getKey(member), member])
				: []);

			const optionalPeers = getOptionalPeers(root);

			for (const member of peerDependenciesGroup.value.members) {
				const name = getKey(member);

				// A non-string peer range is malformed; `valid-fields` reports it, so skip it here.
				if (member.value.type !== 'String') {
					continue;
				}

				const peerRange = member.value.value;
				const devMember = devDependencies.get(name);

				if (!devMember) {
					// An optional peer is not expected to be installed for development, so its absence from `devDependencies` is fine.
					if (optionalPeers.has(name)) {
						continue;
					}

					// Only offer a fix when `devDependencies` is absent or a well-formed object; a malformed group is left to `valid-fields`.
					const canFix = !devDependenciesGroup || devDependenciesGroup.value.type === 'Object';

					context.report({
						node: member.name,
						messageId: MISSING_MESSAGE_ID,
						data: {name},
						suggest: canFix
							? [
								{
									messageId: ADD_SUGGESTION_ID,
									data: {name, range: peerRange},
									* fix(fixer) {
										yield * insertGroupMember(fixer, sourceCode, root, {
											groupMember: devDependenciesGroup,
											groupName: 'devDependencies',
											key: name,
											value: JSON.stringify(peerRange),
										});
									},
								},
							]
							: [],
					});
					continue;
				}

				// When both are valid ranges, the dev version must overlap the peer range, so development happens against a supported version.
				if (devMember.value.type !== 'String') {
					continue;
				}

				const devRange = devMember.value.value;

				if (
					validRange(peerRange) !== null
					&& validRange(devRange) !== null
					&& !semver.intersects(devRange, peerRange)
				) {
					context.report({
						node: devMember.value,
						messageId: MISMATCH_MESSAGE_ID,
						data: {name, devRange, peerRange},
						suggest: [
							{
								messageId: ALIGN_SUGGESTION_ID,
								data: {range: peerRange},
								fix: fixer => fixer.replaceText(devMember.value, JSON.stringify(peerRange)),
							},
						],
					});
				}
			}
		},
	};
};

/** @type {import('eslint').Rule.RuleModule} */
const config = {
	create,
	meta: {
		type: 'suggestion',
		docs: {
			description: 'Enforce peer dependencies to also be listed in `devDependencies` at a compatible version.',
			recommended: true,
		},
		hasSuggestions: true,
		schema: [],
		messages,
		languages: ['json/json'],
	},
};

export default config;
