import {
	findMember,
	getKey,
	getRootObject,
	iterateEffectiveMembers,
} from './utils/index.js';

const MESSAGE_ID = 'no-node-modules-bin-paths';
const SUGGESTION_ID = 'use-binary-names';

const messages = {
	[MESSAGE_ID]: 'The `{{script}}` script invokes a binary through `node_modules/.bin`. Use its name instead; npm adds local binaries to `PATH`.',
	[SUGGESTION_ID]: 'Use binary names instead of `node_modules/.bin` paths.',
};

// Keep quoted words and escaped characters intact so arguments containing shell operators cannot become commands.
const tokenPattern = /#[^\n\r]*|(?:\\.|[^\s"&';<>\\|]|"(?:\\.|[^"\\])*"|'[^']*')+|[<>]+&?|[\n\r&;|]/gsu;
const separatorPattern = /^[\n\r&;|]$/u;
const assignmentPattern = /^[a-z_]\w*=/iu;
const binaryPathPattern = /^(["']?)(?:\.[/\\])?node_modules[/\\]\.bin[/\\](\w[\w\-.]*)\1$/u;

/**
Replace local binary paths in simple command positions, leaving arguments and assignments untouched.
*/
const replaceBinaryPaths = script => {
	let isCommand = true;

	return script.replaceAll(tokenPattern, token => {
		if (separatorPattern.test(token)) {
			isCommand = true;
			return token;
		}

		if (!isCommand || token.startsWith('#') || assignmentPattern.test(token)) {
			return token;
		}

		isCommand = false;

		return token.replace(binaryPathPattern, '$1$2$1');
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
			if (member.value.type !== 'String') {
				continue;
			}

			const script = member.value.value;
			const replacement = replaceBinaryPaths(script);

			if (replacement === script) {
				continue;
			}

			context.report({
				node: member.value,
				messageId: MESSAGE_ID,
				data: {script: getKey(member)},
				suggest: [{
					messageId: SUGGESTION_ID,
					fix: fixer => fixer.replaceText(member.value, JSON.stringify(replacement)),
				}],
			});
		}
	},
});

/** @type {import('eslint').Rule.RuleModule} */
const config = {
	create,
	meta: {
		type: 'suggestion',
		docs: {
			description: 'Disallow direct `node_modules/.bin` paths in scripts.',
			recommended: false,
		},
		hasSuggestions: true,
		schema: [],
		messages,
		languages: ['json/json'],
	},
};

export default config;
