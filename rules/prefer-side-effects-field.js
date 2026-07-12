import {getRootObject, findMember, getKey} from './utils/index.js';

const MESSAGE_ID = 'prefer-side-effects-field';

const messages = {
	[MESSAGE_ID]: 'Declare a `sideEffects` field so bundlers can optimize unused modules.',
};

const bundlerConditionNames = new Set(['browser', 'module']);

const hasBundlerCondition = value => {
	if (value.type === 'Array') {
		for (const element of value.elements) {
			if (hasBundlerCondition(element.value)) {
				return true;
			}
		}

		return false;
	}

	if (value.type !== 'Object') {
		return false;
	}

	for (const member of value.members) {
		if (bundlerConditionNames.has(getKey(member)) || hasBundlerCondition(member.value)) {
			return true;
		}
	}

	return false;
};

const hasBundlerSignal = root => {
	const exportsMember = findMember(root, 'exports');

	if (!exportsMember) {
		return false;
	}

	if (hasBundlerCondition(exportsMember.value)) {
		return true;
	}

	const importsMember = findMember(root, 'imports');

	return Boolean(importsMember && hasBundlerCondition(importsMember.value));
};

/** @param {import('eslint').Rule.RuleContext} context */
const create = context => ({
	Document(node) {
		const root = getRootObject(node);

		if (!root || findMember(root, 'sideEffects') || !hasBundlerSignal(root)) {
			return;
		}

		context.report({
			node: root,
			messageId: MESSAGE_ID,
		});
	},
});

/** @type {import('eslint').Rule.RuleModule} */
const config = {
	create,
	meta: {
		type: 'suggestion',
		docs: {
			description: 'Recommend declaring the `sideEffects` field for packages with an `exports` field and bundler conditions in `exports` or `imports`.',
			recommended: true,
		},
		schema: [],
		messages,
		languages: ['json/json'],
	},
};

export default config;
