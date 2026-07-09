import {
	getRootObject,
	findMember,
	removeMember,
	getIndentString,
	getNewline,
	lineIndentOf,
} from './utils/index.js';

const MESSAGE_ID = 'no-manual-maintainers';
const REMOVE_SUGGESTION_ID = 'remove';
const MOVE_SUGGESTION_ID = 'moveToContributors';

const messages = {
	[MESSAGE_ID]: 'The `maintainers` field is managed by npm from the publishing account; remove it from `package.json`.',
	[REMOVE_SUGGESTION_ID]: 'Remove the `maintainers` field.',
	[MOVE_SUGGESTION_ID]: 'Move the `maintainers` entries into `contributors`.',
};

/** @param {import('eslint').Rule.RuleContext} context */
const create = context => ({
	Document(node) {
		const root = getRootObject(node);

		if (!root) {
			return;
		}

		const maintainers = findMember(root, 'maintainers');

		if (!maintainers) {
			return;
		}

		const {sourceCode} = context;
		const suggest = [
			{
				messageId: REMOVE_SUGGESTION_ID,
				* fix(fixer) {
					yield * removeMember(fixer, sourceCode, maintainers);
				},
			},
		];

		if (maintainers.value.type === 'Array' && maintainers.value.elements.length > 0) {
			const contributors = findMember(root, 'contributors');

			if (!contributors) {
				suggest.push({
					messageId: MOVE_SUGGESTION_ID,
					fix: fixer => fixer.replaceText(maintainers.name, '"contributors"'),
				});
			} else if (contributors.value.type === 'Array') {
				suggest.push({
					messageId: MOVE_SUGGESTION_ID,
					* fix(fixer) {
						const newline = getNewline(sourceCode);
						const entriesText = maintainers.value.elements.map(element => sourceCode.getText(element.value));
						const contributorsElements = contributors.value.elements;

						if (contributorsElements.length === 0) {
							const outerIndent = lineIndentOf(sourceCode, contributors.name);
							const entryIndent = outerIndent + getIndentString(sourceCode);
							yield fixer.insertTextAfterRange(
								[contributors.value.range[0], contributors.value.range[0] + 1],
								`${newline}${entryIndent}${entriesText.join(`,${newline}${entryIndent}`)}${newline}${outerIndent}`,
							);
						} else {
							const entryIndent = lineIndentOf(sourceCode, contributorsElements[0].value);
							yield fixer.insertTextAfter(
								contributorsElements.at(-1).value,
								`,${newline}${entryIndent}${entriesText.join(`,${newline}${entryIndent}`)}`,
							);
						}

						yield * removeMember(fixer, sourceCode, maintainers);
					},
				});
			}
		}

		context.report({
			node: maintainers.name,
			messageId: MESSAGE_ID,
			suggest,
		});
	},
});

/** @type {import('eslint').Rule.RuleModule} */
const config = {
	create,
	meta: {
		type: 'suggestion',
		docs: {
			description: 'Disallow a manually-set `maintainers` field.',
			recommended: true,
		},
		hasSuggestions: true,
		schema: [],
		messages,
		languages: ['json/json'],
	},
};

export default config;
