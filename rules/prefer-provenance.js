import {
	getRootObject,
	findMember,
	isPrivatePackage,
	getIndentString,
	getNewline,
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

							// Insert a new `"provenance": true` member, matching the object's existing indentation.
							const {members} = publishConfigValue;
							const newline = getNewline(sourceCode);
							const lineIndentOf = node => sourceCode.lines[node.loc.start.line - 1].match(/^(\s*)/u)[1];

							if (members.length === 0) {
								// Empty object: indent one level deeper than the `publishConfig` key.
								const outerIndent = lineIndentOf(publishConfigMember);
								const memberIndent = outerIndent + getIndentString(sourceCode);
								const openBraceEnd = publishConfigValue.range[0] + 1;

								yield fixer.insertTextAfterRange([publishConfigValue.range[0], openBraceEnd], `${newline}${memberIndent}"provenance": true${newline}${outerIndent}`);
								return;
							}

							// Non-empty: append after the last member, reusing the existing members' indentation.
							const memberIndent = lineIndentOf(members[0]);

							yield fixer.insertTextAfter(members.at(-1), `,${newline}${memberIndent}"provenance": true`);
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
