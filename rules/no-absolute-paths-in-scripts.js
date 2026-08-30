import path from 'node:path';
import {
	findMember,
	getKey,
	getRootObject,
	iterateEffectiveMembers,
} from './utils/index.js';

const MESSAGE_ID = 'no-absolute-paths-in-scripts';

const messages = {
	[MESSAGE_ID]: 'The `{{script}}` script contains an absolute path.',
};

const hierarchicalUrlSchemePatternSource = String.raw`(?:blob:)?[a-z][\d+\-.a-z]+:\/\/`;
const fileUrlSchemePatternSource = String.raw`file:(?:(?:\/\/)?[a-z]:)?\/`;
const opaqueUrlSchemePatternSource = '(?:data|mailto|urn):';
const urlCharacterPatternSource = String.raw`[^\s"&';<>|]`;
const urlCharacterBeforeQueryPatternSource = String.raw`[^\s"#&';<>?|]`;
const quotedUrlPattern = new RegExp(String.raw`(["'])(?:${hierarchicalUrlSchemePatternSource}|${fileUrlSchemePatternSource}|${opaqueUrlSchemePatternSource})[^"']*\1`, 'gi');
const urlPattern = new RegExp([
	`${hierarchicalUrlSchemePatternSource}${urlCharacterBeforeQueryPatternSource}*[#?]${urlCharacterPatternSource}*`,
	`${fileUrlSchemePatternSource}${urlCharacterPatternSource}*`,
	`${hierarchicalUrlSchemePatternSource}${urlCharacterPatternSource}*/[a-z]:/${urlCharacterPatternSource}*`,
	`${hierarchicalUrlSchemePatternSource}(?:(?!:/)${urlCharacterPatternSource})*`,
	`${opaqueUrlSchemePatternSource}${urlCharacterPatternSource}*`,
].join('|'), 'gi');
const commandWordPattern = /"[^"]*"|'[^']*'|[^\s"&',;<>`{|}]+/gu;
const windowsOptionPrefixPattern = /^\/[^/:=\\]+(?::|=|$)/u;
const attachedPathPattern = /^(?:@|-[a-z]{1,2})((?:[a-z]:)?[/\\].*)$/i;

/**
Check whether a candidate is an absolute path, including one attached to an option.
*/
const isAbsolutePath = candidate => {
	const pathCandidate = attachedPathPattern.exec(candidate)?.[1] ?? candidate;

	return path.posix.isAbsolute(pathCandidate) || path.win32.isAbsolute(pathCandidate);
};

/**
Check whether a shell-like word contains an absolute path.
*/
const hasAbsolutePathInWord = word => {
	const quote = word[0];
	const unquotedWord = (quote === '"' || quote === '\'') && word.at(-1) === quote
		? word.slice(1, -1)
		: word;
	const wordWithoutOption = unquotedWord.replace(windowsOptionPrefixPattern, '');

	for (const assignmentPart of wordWithoutOption.split('=')) {
		const ungroupedPart = assignmentPart.replace(/^(?:\$\(\(?|\(+)/u, '');

		if (isAbsolutePath(ungroupedPart)) {
			return true;
		}

		for (const pathListEntry of ungroupedPart.split(':')) {
			if (isAbsolutePath(pathListEntry)) {
				return true;
			}
		}
	}

	return false;
};

/**
Check whether a script command contains an absolute POSIX or Windows path.
*/
const hasAbsolutePath = command => {
	const commandWithoutQuotedUrls = command.replaceAll(quotedUrlPattern, '$1$1');
	const commandWithoutUrls = commandWithoutQuotedUrls.replaceAll(urlPattern, '');
	const words = commandWithoutUrls.match(commandWordPattern) ?? [];

	return words.some(word => hasAbsolutePathInWord(word));
};

/** @param {import('eslint').Rule.RuleContext} context */
const create = context => ({
	Document(node) {
		const root = getRootObject(node);

		if (!root) {
			return;
		}

		const scripts = findMember(root, 'scripts');

		if (scripts?.value.type !== 'Object') {
			return;
		}

		for (const member of iterateEffectiveMembers(scripts.value)) {
			if (
				member.value.type !== 'String'
				|| !hasAbsolutePath(member.value.value)
			) {
				continue;
			}

			context.report({
				node: member.value,
				messageId: MESSAGE_ID,
				data: {script: getKey(member)},
			});
		}
	},
});

/** @type {import('eslint').Rule.RuleModule} */
const config = {
	create,
	meta: {
		type: 'problem',
		docs: {
			description: 'Disallow absolute paths in scripts.',
			recommended: true,
		},
		schema: [],
		messages,
		languages: ['json/json'],
	},
};

export default config;
