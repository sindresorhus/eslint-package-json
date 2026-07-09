import {
	getRootObject,
	findMember,
	hasGlob,
	optionsSchema,
	pathFields,
} from './utils/index.js';

const MESSAGE_ID_MISSING = 'missing';
const MESSAGE_ID_EXTRA = 'extra';

const messages = {
	[MESSAGE_ID_MISSING]: 'Path `{{value}}` should start with `./`.',
	[MESSAGE_ID_EXTRA]: 'Path `{{value}}` should not start with `./`.',
};

/**
Check if a string value looks like a local relative path (not a glob, not a URL, not absolute).
*/
const isLocalRelativePath = value => {
	if (hasGlob(value)) {
		return false;
	}

	if (value.startsWith('/')) {
		return false;
	}

	if (value.includes('://')) {
		return false;
	}

	return true;
};

/** @param {import('eslint').Rule.RuleContext} context */
const create = context => {
	const {prefix = 'always'} = context.options[0] ?? {};

	/**
	Check a string value node and report if needed.
	*/
	const checkPathNode = valueNode => {
		if (valueNode.type !== 'String') {
			return;
		}

		const {value} = valueNode;

		if (!isLocalRelativePath(value)) {
			return;
		}

		if (prefix === 'always') {
			if (!value.startsWith('./') && !value.startsWith('../')) {
				const fixed = './' + value;

				context.report({
					node: valueNode,
					messageId: MESSAGE_ID_MISSING,
					data: {value},
					fix: fixer => fixer.replaceText(valueNode, JSON.stringify(fixed)),
				});
			}
		} else if (prefix === 'never' && value.startsWith('./')) {
			const fixed = value.slice(2);

			// A bare `./` has nothing to strip to; leave it alone rather than produce an empty path.
			if (fixed === '') {
				return;
			}

			context.report({
				node: valueNode,
				messageId: MESSAGE_ID_EXTRA,
				data: {value},
				fix: fixer => fixer.replaceText(valueNode, JSON.stringify(fixed)),
			});
		}
	};

	return {
		Document(node) {
			const root = getRootObject(node);

			if (!root) {
				return;
			}

			for (const field of pathFields) {
				const member = findMember(root, field);

				if (member) {
					checkPathNode(member.value);
				}
			}

			const binMember = findMember(root, 'bin');

			if (!binMember) {
				return;
			}

			if (binMember.value.type === 'String') {
				checkPathNode(binMember.value);
			} else if (binMember.value.type === 'Object') {
				for (const childMember of binMember.value.members) {
					checkPathNode(childMember.value);
				}
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
			description: 'Enforce consistent `./` prefix on local path fields.',
			recommended: true,
		},
		fixable: 'code',
		schema: optionsSchema({
			prefix: {
				enum: ['always', 'never'],
			},
		}),
		messages,
		languages: ['json/json'],
	},
};

export default config;
