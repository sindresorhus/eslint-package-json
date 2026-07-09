import {getRootObject, findMember, getKey} from './utils/index.js';

const MESSAGE_ID = 'require-exports-root';

const messages = {
	[MESSAGE_ID]: '`exports` has subpaths but no `.` root entry, so the package cannot be imported by its name.',
};

/** @param {import('eslint').Rule.RuleContext} context */
const create = context => ({
	Document(node) {
		const root = getRootObject(node);

		if (!root) {
			return;
		}

		const exportsMember = findMember(root, 'exports');

		if (exportsMember?.value.type !== 'Object') {
			return;
		}

		// Only subpath maps (keys starting with `.`) need a root. A conditions object (keys like `import`/`default`) is itself the root.
		const isSubpathMap = exportsMember.value.members.some(member => getKey(member).startsWith('.'));

		if (!isSubpathMap || findMember(exportsMember.value, '.')) {
			return;
		}

		context.report({
			node: exportsMember.value,
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
			description: 'Require a `.` root entry in the `exports` field.',
			recommended: false,
		},
		schema: [],
		messages,
		languages: ['json/json'],
	},
};

export default config;
