import {findMember, getRootObject, invalidPackageTargetPattern} from './utils/index.js';

const MESSAGE_ID = 'no-fallback-export-arrays';

const messages = {
	[MESSAGE_ID]: 'String-target arrays in `{{field}}` are not fallback lists in Node.js; a missing first file or package does not make Node.js try the next target.',
};

/**
Whether a string is an invalid relative package target that Node.js skips in a fallback array.
*/
function isInvalidRelativePackageTarget(value) {
	const relativePath = value.slice(2);
	const segments = relativePath.split(/[/\\]/u);

	return segments.some(segment => segment === '' || segment === '.' || segment === '..' || segment.toLowerCase() === 'node_modules')
		|| invalidPackageTargetPattern.test(relativePath);
}

/**
Whether Node.js skips a string target as an invalid package target in a fallback array.
*/
function isInvalidPackageTarget(value, field) {
	if (value.startsWith('./')) {
		return isInvalidRelativePackageTarget(value);
	}

	return field === 'exports'
		|| value.startsWith('../')
		|| value.startsWith('/')
		|| URL.canParse(value);
}

/**
Whether an array contains multiple direct string targets that should be checked by this rule.
*/
function isStringTargetArray(node, field) {
	return node.elements.length >= 2
		&& node.elements.every(element => element.value.type === 'String')
		&& node.elements.every(element => !isInvalidPackageTarget(element.value.value, field));
}

/**
Recursively find arrays with at least two direct string targets.
*/
function * findStringTargetArrays(node, field) {
	switch (node.type) {
		case 'Object': {
			for (const member of node.members) {
				yield * findStringTargetArrays(member.value, field);
			}

			break;
		}

		case 'Array': {
			if (isStringTargetArray(node, field)) {
				yield node;
				break;
			}

			for (const element of node.elements) {
				yield * findStringTargetArrays(element.value, field);
			}

			break;
		}
	// No default
	}
}

/** @param {import('eslint').Rule.RuleContext} context */
const create = context => ({
	Document(node) {
		const root = getRootObject(node);

		if (!root) {
			return;
		}

		for (const field of ['exports', 'imports']) {
			const member = findMember(root, field);

			if (!member) {
				continue;
			}

			// `imports` must be an object. Leave invalid top-level values to `valid-fields`.
			if (field === 'imports' && member.value.type !== 'Object') {
				continue;
			}

			for (const array of findStringTargetArrays(member.value, field)) {
				context.report({
					node: array,
					messageId: MESSAGE_ID,
					data: {field},
				});
			}
		}
	},
});

/** @type {import('eslint').Rule.RuleModule} */
const config = {
	create,
	meta: {
		type: 'suggestion',
		docs: {
			description: 'Discourage string-target fallback arrays in `exports`/`imports`.',
			recommended: true,
		},
		schema: [],
		messages,
		languages: ['json/json'],
	},
};

export default config;
