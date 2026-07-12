import {getRootObject, findMember, getKey} from './utils/index.js';

const MESSAGE_ID = 'no-exports-trailing-slash';
const MESSAGE_ID_PATTERN = 'pattern';

const messages = {
	[MESSAGE_ID]: 'Trailing-slash folder mapping `{{value}}` in `{{field}}` is deprecated; use a subpath pattern like `{{suggestion}}` instead.',
	[MESSAGE_ID_PATTERN]: 'Trailing-slash mapping `{{value}}` in `{{field}}` is deprecated; use a subpath pattern without a trailing slash.',
};

/**
Recursively walk an `exports`/`imports` value tree, yielding every trailing-slash subpath key and string value.
*/
function * findTrailingSlashes(node, subpathPrefix, canFixTarget = false, isPattern = false) {
	switch (node.type) {
		case 'Object': {
			for (const member of node.members) {
				const key = getKey(member);
				const memberIsPattern = isPattern || key.includes('*');
				const isFolderMapping = key.startsWith(subpathPrefix)
					&& key.endsWith('/')
					&& !key.includes('*')
					&& member.value.type === 'String'
					&& member.value.value.endsWith('/')
					&& !member.value.value.includes('*');

				if (key.startsWith(subpathPrefix) && key.endsWith('/')) {
					yield {node: member.name, canFix: isFolderMapping, isPattern: memberIsPattern};
				}

				yield * findTrailingSlashes(member.value, subpathPrefix, isFolderMapping, memberIsPattern);
			}

			break;
		}

		case 'Array': {
			for (const element of node.elements) {
				yield * findTrailingSlashes(element.value, subpathPrefix, canFixTarget);
			}

			break;
		}

		case 'String': {
			if (node.value.endsWith('/')) {
				yield {node, canFix: canFixTarget, isPattern: isPattern || node.value.includes('*')};
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

		for (const [field, subpathPrefix] of [['exports', '.'], ['imports', '#']]) {
			const member = findMember(root, field);

			if (!member) {
				continue;
			}

			for (const target of findTrailingSlashes(member.value, subpathPrefix)) {
				const {node: targetNode, canFix} = target;
				const {value} = targetNode;
				const isPattern = target.isPattern || value.includes('*');
				const suggestion = value + '*';
				const report = {
					node: targetNode,
					messageId: isPattern ? MESSAGE_ID_PATTERN : MESSAGE_ID,
					data: isPattern ? {field, value} : {field, value, suggestion},
				};

				if (canFix) {
					report.fix = fixer => fixer.replaceText(targetNode, JSON.stringify(suggestion));
				}

				context.report(report);
			}
		}
	},
});

/** @type {import('eslint').Rule.RuleModule} */
const config = {
	create,
	meta: {
		type: 'problem',
		docs: {
			description: 'Disallow deprecated trailing-slash folder mappings in `exports`/`imports`.',
			recommended: true,
		},
		fixable: 'code',
		schema: [],
		messages,
		languages: ['json/json'],
	},
};

export default config;
