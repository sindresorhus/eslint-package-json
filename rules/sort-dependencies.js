import {
	dependencyTypes,
	getRootObject,
	findMember,
	buildReordered,
	getSortedMembers,
	optionsSchema,
	stringArraySchema,
} from './utils/index.js';

const MESSAGE_ID = 'sort-dependencies';

const messages = {
	[MESSAGE_ID]: 'Keys in `{{group}}` should be sorted alphabetically.',
};

/**
Default dependency object names to check for alphabetical ordering.
*/
const defaultProperties = [...dependencyTypes, 'peerDependenciesMeta'];

/** @param {import('eslint').Rule.RuleContext} context */
const create = context => {
	const {properties = defaultProperties} = context.options[0] ?? {};
	const {sourceCode} = context;

	return {
		Document(node) {
			const root = getRootObject(node);

			if (!root) {
				return;
			}

			for (const groupName of properties) {
				const groupMember = findMember(root, groupName);

				if (groupMember?.value.type !== 'Object') {
					continue;
				}

				const objectNode = groupMember.value;
				const sortedMembers = getSortedMembers(objectNode);

				if (!sortedMembers) {
					continue;
				}

				context.report({
					node: objectNode,
					messageId: MESSAGE_ID,
					data: {group: groupName},
					fix: fixer => fixer.replaceText(
						objectNode,
						buildReordered(sourceCode, objectNode, sortedMembers),
					),
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
			description: 'Enforce alphabetical ordering of dependencies.',
			recommended: true,
		},
		fixable: 'code',
		schema: optionsSchema({properties: stringArraySchema}),
		messages,
		languages: ['json/json'],
	},
};

export default config;
