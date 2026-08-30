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

const commandWordSeparatorPattern = /[\s"&';<>`|]+/u;
const quotedUrlPattern = /(["'])(?:[a-z][\d+\-.a-z]*:\/\/|data:|file:\/)[^"']*\1/gi;
const urlPattern = /(^|[\s(=])(?:[a-z][\d+\-.a-z]*:\/\/|data:|file:\/)[^\s"&':;<>|]*/gi;
const windowsOptionPattern = /^\/[a-z]+$/i;
const windowsOptionWithValuePattern = /^\/[a-z]+:/i;
const attachedPathPattern = /^(?:@|-[a-z]{1,2})((?:[a-z]:)?[/\\].*)$/i;

/**
Check whether a candidate is an absolute path, including one attached to an option.
*/
const isAbsolutePath = candidate => {
	if (
		path.posix.isAbsolute(candidate)
		|| path.win32.isAbsolute(candidate)
	) {
		return true;
	}

	const attachedPath = attachedPathPattern.exec(candidate)?.[1];

	return attachedPath !== undefined && isAbsolutePath(attachedPath);
};

/**
Check whether a shell-like word contains an absolute path.
*/
const hasAbsolutePathInWord = word => {
	if (windowsOptionPattern.test(word)) {
		return false;
	}

	const wordWithoutOption = windowsOptionWithValuePattern.test(word)
		? word.slice(word.indexOf(':') + 1)
		: word;

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
	const commandWithoutUrls = commandWithoutQuotedUrls.replaceAll(urlPattern, '$1');

	return commandWithoutUrls.split(commandWordSeparatorPattern).some(word => hasAbsolutePathInWord(word));
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
