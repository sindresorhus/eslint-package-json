import {isRegExp} from 'node:util/types';
import {
	findMember,
	getKey,
	getRootObject,
	optionsSchema,
} from './utils/index.js';

const MESSAGE_ID = 'no-orphan-script-hooks';
const MESSAGE_ID_UNINSTALL = 'removedLifecycle';

const messages = {
	[MESSAGE_ID]: 'The `{{hook}}` script has no corresponding `{{target}}` script.',
	[MESSAGE_ID_UNINSTALL]: 'The `{{hook}}` script never runs, because npm removed the uninstall lifecycle in v7.',
};

// The npm CLI v7 dropped the uninstall lifecycle entirely: it cannot tell why a package is going away, so `preuninstall`, `uninstall`, and `postuninstall` are documented as never running. Adding the missing `uninstall` script would not help, so these get their own message.
const removedUninstallHooks = new Set(['preuninstall', 'uninstall', 'postuninstall']);

const hookPrefixes = ['pre', 'post'];

const standaloneScriptPattern = /^(?:postcss|posthtml|prepare|prettier|preview)(?::|$)/u;
const standaloneGitHookNames = new Set(['precommit', 'pre-commit', 'prepush', 'pre-push']);

// The npm CLI can run these scripts without a correspondingly named package script.
const specialScriptNames = new Set([
	'prepublish',
	'prepublishOnly',
	'prepack',
	'postpack',
	'preinstall',
	'postinstall',
	'preenv',
	'postenv',
	'prerestart',
	'postrestart',
	'preprepare',
	'postprepare',
	'postpublish',
	'predependencies',
	'postdependencies',
	'preversion',
	'postversion',
]);

/**
Get the target script name for a `pre`/`post` hook, or `undefined` when the name is not a hook.
*/
const getHookTarget = name => {
	for (const prefix of hookPrefixes) {
		if (
			name.length > prefix.length
			&& name.startsWith(prefix)
		) {
			return name.slice(prefix.length);
		}
	}
};

/**
Compile one `ignore` entry.

`RegExp` construction throws on a malformed source, which would otherwise surface as an unattributed "Error while loading rule". Writing a glob here is an easy mistake to make, so say which pattern is at fault and why.
*/
const toIgnorePattern = pattern => {
	if (isRegExp(pattern)) {
		return new RegExp(pattern);
	}

	try {
		return new RegExp(pattern, 'u');
	} catch {
		throw new Error(`The \`ignore\` option of \`no-orphan-script-hooks\` takes regular expressions, not globs, and ${JSON.stringify(pattern)} is not a valid one.`);
	}
};

/**
Check whether a script name matches one of the ignored patterns without retaining state from global or sticky regular expressions.
*/
const isIgnoredName = (name, patterns) => patterns.some(regexp => {
	regexp.lastIndex = 0;
	const isIgnored = regexp.test(name);
	regexp.lastIndex = 0;
	return isIgnored;
});

/** @param {import('eslint').Rule.RuleContext} context */
const create = context => {
	const {ignore = []} = context.options[0] ?? {};
	const ignoredPatterns = ignore.map(pattern => toIgnorePattern(pattern));

	return {
		Document(node) {
			const root = getRootObject(node);

			if (!root) {
				return;
			}

			const scripts = findMember(root, 'scripts');

			if (scripts?.value.type !== 'Object') {
				return;
			}

			const scriptNames = new Set(scripts.value.members.map(member => getKey(member)));

			for (const member of scripts.value.members) {
				const hook = getKey(member);

				if (
					specialScriptNames.has(hook)
					|| standaloneScriptPattern.test(hook)
					|| standaloneGitHookNames.has(hook)
					|| isIgnoredName(hook, ignoredPatterns)
				) {
					continue;
				}

				if (removedUninstallHooks.has(hook)) {
					context.report({
						node: member.name,
						messageId: MESSAGE_ID_UNINSTALL,
						data: {hook},
					});
					continue;
				}

				const target = getHookTarget(hook);

				if (
					target === undefined
					|| scriptNames.has(target)
				) {
					continue;
				}

				context.report({
					node: member.name,
					messageId: MESSAGE_ID,
					data: {hook, target},
				});
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
			description: 'Disallow `pre`/`post` script hooks without a corresponding script.',
			recommended: true,
		},
		schema: optionsSchema({
			ignore: {
				type: 'array',
				uniqueItems: true,
			},
		}),
		messages,
		languages: ['json/json'],
	},
};

export default config;
