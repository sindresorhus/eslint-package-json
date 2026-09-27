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

// `:` and `-` both namespace a sub-command: `npm run prepare:build` and `npm run prepare-build` are each run on
// their own, and npm looks for `preprepare:build` or `preprepare-build` around them, never for a `pre` hook on a
// script called `pare-build`.
const standaloneScriptPattern = /^(?:postcss|posthtml|prepare|prettier|preview)(?:[-:]|$)/u;

// `npm run install-<name>` would run `preinstall-<name>` and `postinstall-<name>` as its hooks, but a package names a script that way to mark it as a step of its `preinstall` or `postinstall` lifecycle script, which runs it on its own by name. So it is treated as standalone, like `prepare:*`. The `pure` prompt uses this for its symlink step and its failure message.
const namespacedInstallScriptPattern = /^(?:pre|post)install[-:]/u;

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

	// Every other entry becomes `RegExp` source, so anything that is not a non-empty string is stringified into
	// a pattern the author never wrote. `''` is the worst of those: it matches every script name, which turns
	// the rule off without saying so.
	if (typeof pattern !== 'string' || pattern === '') {
		// `String` rather than `JSON.stringify`, which throws on a value it cannot serialize, such as a `BigInt`
		// or an object with a cycle, and so would replace this message with a worse one.
		throw new Error(`The \`ignore\` option of \`no-orphan-script-hooks\` takes regular expression sources, and ${String(pattern)} is not one.`);
	}

	try {
		// The `u` flag rejects a few sources the non-unicode grammar accepts, such as a lone `\\p` or a
		// duplicated group name, so the message names the flag as well as the option.
		const regexp = new RegExp(pattern, 'u');

		// V8 defers a source too large to compile until it is first matched, so without this the failure
		// would surface from inside the visitor, once per linted file, with the whole source in the message
		// and nothing naming the option.
		regexp.test('');

		return regexp;
	} catch (error) {
		throw new Error(
			`The \`ignore\` option of \`no-orphan-script-hooks\` takes regular expression sources, not globs, and ${JSON.stringify(pattern)} is not a valid one with the \`u\` flag this rule adds.`,
			{cause: error},
		);
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
					|| namespacedInstallScriptPattern.test(hook)
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
			// A JSON Schema cannot say "string or `RegExp`", and the `RegExp` form only a JavaScript config can
			// express, so the entries are checked by the rule itself rather than here.
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
