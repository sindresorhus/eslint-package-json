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

const hierarchicalUrlPrefixPatternSource = String.raw`(?:blob:)?[a-z][\d+\-.a-z]+:\/\/`;
const fileUrlPrefixPatternSource = String.raw`file:(?:(?:\/\/)?[a-z]:)?\/`;
const opaqueUrlPrefixPatternSource = '(?:data|mailto|urn):';
const urlPrefixBoundaryPatternSource = String.raw`(?<![\w+\-.])`;
const hierarchicalUrlPatternSource = `${urlPrefixBoundaryPatternSource}${hierarchicalUrlPrefixPatternSource}`;
const fileUrlPatternSource = `${urlPrefixBoundaryPatternSource}${fileUrlPrefixPatternSource}`;
const opaqueUrlPatternSource = `${urlPrefixBoundaryPatternSource}${opaqueUrlPrefixPatternSource}`;
const urlCharacterPatternSource = String.raw`[^\s"&';<>|]`;
const urlCharacterBeforeQueryPatternSource = String.raw`[^\s"#&';<>?|]`;
const quotedUrlPattern = new RegExp(String.raw`(["'])(?:${hierarchicalUrlPrefixPatternSource}|${fileUrlPrefixPatternSource}|${opaqueUrlPrefixPatternSource})[^\s"']*\1`, 'gi');
// Query text and URL paths may contain `:/`, while the fallback must stop before a neighboring absolute path-list entry.
const urlPattern = new RegExp([
	`${hierarchicalUrlPatternSource}${urlCharacterBeforeQueryPatternSource}*[#?]${urlCharacterPatternSource}*`,
	`${fileUrlPatternSource}${urlCharacterPatternSource}*`,
	`${hierarchicalUrlPatternSource}${urlCharacterPatternSource}*/[a-z]:/${urlCharacterPatternSource}*`,
	`${hierarchicalUrlPatternSource}(?:(?!:/)${urlCharacterPatternSource})*`,
	`${opaqueUrlPatternSource}${urlCharacterPatternSource}*`,
].join('|'), 'gi');
const commandWordPattern = /[^\s"&',;<=>`{|}]*=(?:"[^"]*"|'[^']*')|"[^"]*"|'[^']*'|[^\s"&',;<>`{|}]+/gu;
const windowsOptionPrefixPattern = /^\/[^/:=\\]+(?::|=|$)/u;
const attachedPathPattern = /^(?:@|-[a-z])((?:[a-z]:)?[/\\].*)$/i;
const quoteDelimiterPattern = /^["']+|["']+$/gu;
const shellParameterAlternativeValuePattern = /\$\{[a-z_]\w*:?[+-]([^{}]*)\}/giu;

/**
Check whether a candidate is an absolute path, including one attached to an option.
*/
const isAbsolutePath = candidate => {
	const pathCandidate = attachedPathPattern.exec(candidate)?.[1] ?? candidate;

	return path.posix.isAbsolute(pathCandidate) || path.win32.isAbsolute(pathCandidate);
};

/**
Check whether a value contains an absolute path.
*/
const hasAbsolutePathInValue = (value, canBeWindowsOption) => {
	const unquotedValue = value.replaceAll(quoteDelimiterPattern, '');
	const valueWithoutWindowsOptionPrefix = canBeWindowsOption
		? unquotedValue.replace(windowsOptionPrefixPattern, '')
		: unquotedValue;
	const ungroupedValue = valueWithoutWindowsOptionPrefix.replace(/^(?:\$\(\(?|\(+)/u, '');

	if (isAbsolutePath(ungroupedValue)) {
		return true;
	}

	return ungroupedValue.split(/[:;]/u).some(pathListEntry => isAbsolutePath(pathListEntry));
};

/**
Check whether a path candidate contains an absolute path.
*/
const hasAbsolutePathInCandidate = candidate => {
	for (const [index, assignmentPart] of candidate.split('=').entries()) {
		if (hasAbsolutePathInValue(assignmentPart, index === 0)) {
			return true;
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

	for (const match of commandWithoutUrls.matchAll(shellParameterAlternativeValuePattern)) {
		if (hasAbsolutePathInValue(match[1], false)) {
			return true;
		}
	}

	const candidates = (commandWithoutUrls.match(commandWordPattern) ?? []).flatMap(word => word.split(/\s+/u));

	return candidates.some((candidate, index) => hasAbsolutePathInCandidate(candidate)
		|| (candidates[index - 1] === '=' && hasAbsolutePathInValue(candidate, false)));
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
