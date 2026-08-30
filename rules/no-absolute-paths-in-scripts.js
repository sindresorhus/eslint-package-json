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

const urlPrefixPatternSource = String.raw`(?:(?:blob:)?[a-z][\d+\-.a-z]+:\/\/|file:(?:(?:\/\/)?[a-z]:)?\/|(?:data|mailto|urn):)`;
const quotedUrlPattern = new RegExp(String.raw`(["'])${urlPrefixPatternSource}[^\s"']*\1`, 'giu');
const urlPattern = new RegExp(String.raw`(?<![\w+\-.])${urlPrefixPatternSource}[^\s"&';<>|]*`, 'giu');
const commandWordPattern = /[^\s"&',;<=>`{|}]*=(?:"[^"]*"|'[^']*')|"[^"]*"|'[^']*'|[<>]+|[^\s"&',;<>`{|}]+/gu;
const unambiguousValueIntroducers = new Set(['=', '<', '<>', '>', '>>']);
const windowsOptionPrefixPattern = /^\/[^/:=\\]+(?::|=|$)/u;
const attachedPathPattern = /^(?:@|-[a-z])((?:[a-z]:)?[/\\].*)$/i;
const quoteDelimiterPattern = /^["']+|["']+$/gu;
const shellParameterExpansionPattern = /\$\{[^{}]*\}/gu;

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
	const commandWithMaskedShellParameterExpansions = command.replaceAll(shellParameterExpansionPattern, 'shell-parameter');
	const commandWithoutQuotedUrls = commandWithMaskedShellParameterExpansions.replaceAll(quotedUrlPattern, '$1$1');
	const commandWithoutUrls = commandWithoutQuotedUrls.replaceAll(urlPattern, '');

	const candidates = (commandWithoutUrls.match(commandWordPattern) ?? []).flatMap(word => word.split(/\s+/u));

	return candidates.some((candidate, index) => {
		const previousCandidate = candidates[index - 1];
		const isUnambiguousValue = unambiguousValueIntroducers.has(previousCandidate);

		return hasAbsolutePathInCandidate(candidate)
			|| (isUnambiguousValue && hasAbsolutePathInValue(candidate, false));
	});
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
