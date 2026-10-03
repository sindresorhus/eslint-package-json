import {
	getRootObject,
	findMember,
	removeMemberAndDuplicates,
	removeShadowedDuplicates,
	getIndentString,
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

/**
Get the leading indentation (whitespace) of the line where a node starts, or `''` if the node is not at the start of its line.

A node that shares its line with earlier content is inline, so `''` doubles as the signal to keep an insertion on the same line rather than break it across newlines.
*/
function getIndentPrefix(sourceCode, node) {
	const {text} = sourceCode;
	const lineStart = text.lastIndexOf('\n', node.range[0] - 1) + 1;
	const linePrefix = text.slice(lineStart, node.range[0]);

	return /^\s*$/.test(linePrefix) ? linePrefix : '';
}

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
					yield * removeMemberAndDuplicates(fixer, sourceCode, maintainers);
				},
			},
		];

		if (maintainers.value.type === 'Array' && maintainers.value.elements.length > 0) {
			const contributors = findMember(root, 'contributors');

			if (!contributors) {
				suggest.push({
					messageId: MOVE_SUGGESTION_ID,
					* fix(fixer) {
						yield fixer.replaceText(maintainers.name, '"contributors"');
						yield * removeShadowedDuplicates(fixer, sourceCode, maintainers);
					},
				});
			} else if (contributors.value.type === 'Array') {
				suggest.push({
					messageId: MOVE_SUGGESTION_ID,
					* fix(fixer) {
						const newline = '\n';
						const entriesText = maintainers.value.elements.map(element => sourceCode.getText(element.value));
						const contributorsElements = contributors.value.elements;

						if (contributorsElements.length === 0) {
							const contents = sourceCode.text.slice(contributors.value.range[0] + 1, contributors.value.range[1] - 1);

							// An empty array written on one line stays on one line, the way the non-empty branch below does. A multiline one has its contents replaced rather than appended to, or the closing indent the author wrote would end up alone on a line.
							if (contents.includes('\n')) {
								const outerIndent = lineIndentOf(sourceCode, contributors.name);
								const entryIndent = outerIndent + getIndentString(sourceCode);
								yield fixer.replaceTextRange(
									[contributors.value.range[0] + 1, contributors.value.range[1] - 1],
									`${newline}${entryIndent}${entriesText.join(`,${newline}${entryIndent}`)}${newline}${outerIndent}`,
								);
							} else {
								yield fixer.insertTextAfterRange([contributors.value.range[0] + 1, contributors.value.range[0] + 1], `${contents}${entriesText.join(', ')}`);
							}
						} else {
							// A single-line array keeps the moved entries on the same line; a multiline one puts each on its own line at the existing entry indentation.
							const prefix = getIndentPrefix(sourceCode, contributorsElements[0].value);
							const separator = prefix === '' ? ' ' : `${newline}${prefix}`;
							yield fixer.insertTextAfter(
								contributorsElements.at(-1).value,
								`,${separator}${entriesText.join(`,${separator}`)}`,
							);
						}

						yield * removeMemberAndDuplicates(fixer, sourceCode, maintainers);
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
