import {getRootObject, findMember, getKey} from './utils/index.js';

const MESSAGE_ID = 'require-exports-root';
const MESSAGE_ID_NO_RUNTIME = 'noRuntime';
const MESSAGE_ID_MISMATCH = 'mainMismatch';

const messages = {
	[MESSAGE_ID]: '`exports` has subpaths but no `.` root entry, so the package cannot be imported by its name.',
	[MESSAGE_ID_NO_RUNTIME]: 'The `exports` root must expose a runtime entry point, not only types or a blocked target.',
	[MESSAGE_ID_MISMATCH]: 'The `exports` root does not expose the package `main` entry point `{{main}}`.',
};

function isTypesCondition(key) {
	return key === 'types' || key.startsWith('types@');
}

function * iterateRuntimeTargets(node) {
	switch (node.type) {
		case 'String': {
			if (!node.value.endsWith('.d.ts') && !node.value.endsWith('.d.mts') && !node.value.endsWith('.d.cts')) {
				yield node;
			}

			break;
		}

		case 'Object': {
			for (const member of node.members) {
				if (isTypesCondition(getKey(member))) {
					continue;
				}

				yield * iterateRuntimeTargets(member.value);
			}

			break;
		}

		case 'Array': {
			for (const element of node.elements) {
				yield * iterateRuntimeTargets(element.value);
			}

			break;
		}
	// No default
	}
}

function normalizePath(value) {
	return value.replace(/^\.\//u, '');
}

function isSubpathMap(objectNode) {
	return objectNode.members.some(member => getKey(member).startsWith('.'));
}

/** @param {import('eslint').Rule.RuleContext} context */
const create = context => ({
	Document(node) {
		const root = getRootObject(node);

		if (!root) {
			return;
		}

		const exportsMember = findMember(root, 'exports');

		if (!exportsMember) {
			return;
		}

		let rootValue = exportsMember.value;

		if (exportsMember.value.type === 'Object' && isSubpathMap(exportsMember.value)) {
			const rootMember = findMember(exportsMember.value, '.');

			if (!rootMember) {
				context.report({
					node: exportsMember.value,
					messageId: MESSAGE_ID,
				});
				return;
			}

			rootValue = rootMember.value;
		}

		if ([...iterateRuntimeTargets(rootValue)].length === 0) {
			context.report({
				node: rootValue,
				messageId: MESSAGE_ID_NO_RUNTIME,
			});
			return;
		}

		const main = findMember(root, 'main');

		if (main?.value.type !== 'String' || main.value.value === '') {
			return;
		}

		const mainPath = normalizePath(main.value.value);

		if ([...iterateRuntimeTargets(rootValue)].some(target => normalizePath(target.value) === mainPath)) {
			return;
		}

		context.report({
			node: rootValue,
			messageId: MESSAGE_ID_MISMATCH,
			data: {main: main.value.value},
		});
	},
});

/** @type {import('eslint').Rule.RuleModule} */
const config = {
	create,
	meta: {
		type: 'suggestion',
		docs: {
			description: 'Require a usable `.` root entry in the `exports` field.',
			recommended: false,
		},
		schema: [],
		messages,
		languages: ['json/json'],
	},
};

export default config;
