import {isRegExp} from 'node:util/types';
import {
	findMember,
	getKey,
	getRootObject,
	optionsSchema,
} from './utils/index.js';

const MESSAGE_ID = 'no-orphan-script-hooks';

const messages = {
	[MESSAGE_ID]: 'The `{{hook}}` script has no corresponding `{{target}}` script.',
};

const hookPrefixes = ['pre', 'post'];

// The npm CLI can run these scripts without a correspondingly named package script.
const specialScriptNames = new Set([
	'prepare',
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
	const ignoredPatterns = ignore.map(pattern => isRegExp(pattern) ? new RegExp(pattern) : new RegExp(pattern, 'u'));

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
					|| isIgnoredName(hook, ignoredPatterns)
				) {
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
