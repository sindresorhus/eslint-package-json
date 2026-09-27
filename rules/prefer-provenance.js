import {
	getRootObject,
	findMember,
	isPrivatePackage,
	insertMember,
} from './utils/index.js';

const MESSAGE_ID = 'prefer-provenance';
const SUGGESTION_ID = 'enable';

const messages = {
	[MESSAGE_ID]: 'Enable npm provenance via `publishConfig.provenance`.',
	[SUGGESTION_ID]: 'Set `provenance` to `true`.',
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

			// Skip private packages.
			if (isPrivatePackage(root)) {
				return;
			}

			const publishConfigMember = findMember(root, 'publishConfig');

			// Only act when publishConfig exists and is an Object.
			if (!publishConfigMember || publishConfigMember.value.type !== 'Object') {
				return;
			}

			const publishConfigValue = publishConfigMember.value;
			const provenanceMember = findMember(publishConfigValue, 'provenance');

			// If provenance is already true, nothing to do.
			if (provenanceMember?.value.type === 'Boolean' && provenanceMember.value.value === true) {
				return;
			}

			context.report({
				node: publishConfigValue,
				messageId: MESSAGE_ID,
				suggest: [
					{
						messageId: SUGGESTION_ID,
						* fix(fixer) {
							if (provenanceMember) {
								// Replace the existing value with `true`.
								yield fixer.replaceText(provenanceMember.value, 'true');
								return;
							}

							// Append a new `"provenance": true` member in the object's own layout.
							yield insertMember(fixer, sourceCode, publishConfigValue, {index: publishConfigValue.members.length, entry: '"provenance": true'});
						},
					},
				],
			});
		},
	};
};

/** @type {import('eslint').Rule.RuleModule} */
const config = {
	create,
	meta: {
		type: 'suggestion',
		docs: {
			description: 'Enforce npm provenance via `publishConfig.provenance`.',
			recommended: false,
		},
		hasSuggestions: true,
		schema: [],
		messages,
		languages: ['json/json'],
	},
};

export default config;
