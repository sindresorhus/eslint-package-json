import {
	getRootObject,
	findMember,
	getKey,
	iterateEffectiveMembers,
} from './utils/index.js';

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
			// Only the effective member counts: a runtime target hiding under a shadowed duplicate is not part of the object Node resolves, so it must not make the root look usable.
			for (const member of iterateEffectiveMembers(node)) {
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

// `main` and an export target can spell the same file differently, so both sides drop a leading `./` before they are compared. `main` also drops a trailing `/`, while export targets retain it because Node no longer resolves trailing-slash targets. `.` and `./` both name the package root, which is the empty path.
function normalizePath(value) {
	const path = value.replace(/^\.\//u, '');
	return path === '.' ? '' : path;
}

const normalizeMainPath = value => normalizePath(value.replace(/\/+$/u, ''));

function isSubpathMap(objectNode) {
	return objectNode.members.some(member => getKey(member).startsWith('.'));
}

// Node's legacy CommonJS resolution first tries the `main` path as a file, then appends `.js`, `.json`, and `.node`, and finally tries the same extensions under an `index` path. Without reading the filesystem the rule cannot tell which form resolves, so every form Node would try counts as a match.
const cjsExtensions = ['.js', '.json', '.node'];

const getMainCandidates = mainPath => {
	// The package root normalizes to the empty path, so the `index` file under it carries no directory prefix.
	const directoryPrefix = mainPath === '' ? '' : `${mainPath}/`;
	const extensionCandidates = mainPath === '' ? [] : cjsExtensions.map(extension => mainPath + extension);

	return [
		mainPath,
		...extensionCandidates,
		...cjsExtensions.map(extension => `${directoryPrefix}index${extension}`),
	];
};

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

		const runtimeTargets = [...iterateRuntimeTargets(rootValue)];

		if (runtimeTargets.length === 0) {
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

		const mainCandidates = new Set(getMainCandidates(normalizeMainPath(main.value.value)));

		if (runtimeTargets.some(target => !target.value.endsWith('/') && mainCandidates.has(normalizePath(target.value)))) {
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
