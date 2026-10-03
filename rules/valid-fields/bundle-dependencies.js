import {
	findMember,
	getKey,
	hasDependency,
	iterateEffectiveMembers,
	runtimeDependencyTypes,
} from '../utils/index.js';

const TYPE_MESSAGE_ID = 'type';
const ELEMENT_MESSAGE_ID = 'element';
const MISSING_MESSAGE_ID = 'missing';

export const messages = {
	[TYPE_MESSAGE_ID]: 'The `{{field}}` field must be a list of names, or a boolean npm fills in from `dependencies`.',
	[ELEMENT_MESSAGE_ID]: 'Each `{{field}}` entry must be a string.',
	[MISSING_MESSAGE_ID]: '`{{name}}` is bundled but is not a dependency, so npm adds `"{{name}}": "*"` to the published `dependencies` and consumers get it as a wildcard runtime dependency.',
};

/**
The name nodes npm reads out of a bundle list, or `undefined` for a value it does not read as one. An object is a form npm reads too: it takes the keys as the names.
*/
function getNameNodes(value) {
	if (value.type === 'Array') {
		return value.elements.map(element => element.value);
	}

	if (value.type === 'Object') {
		return [...iterateEffectiveMembers(value)].map(member => member.name);
	}

	return undefined;
}

export function * check(root) {
	// Npm reads the old `bundledDependencies` spelling only when `bundleDependencies` is missing, and deletes it either way, so only one of them is ever published.
	const member = findMember(root, 'bundleDependencies') ?? findMember(root, 'bundledDependencies');

	if (!member) {
		return;
	}

	const field = getKey(member);

	// A boolean is a form npm reads: `true` fills the list in from `dependencies` and `false` deletes the field, so neither is left in the published manifest as written. Neither is a type error either.
	if (member.value.type === 'Boolean') {
		return;
	}

	const nameNodes = getNameNodes(member.value);

	if (!nameNodes) {
		yield {
			node: member.value,
			messageId: TYPE_MESSAGE_ID,
			data: {field},
		};
		return;
	}

	// A bundled package must be a real runtime dependency (`devDependencies` are not published).
	for (const node of nameNodes) {
		if (node.type !== 'String') {
			yield {
				node,
				messageId: ELEMENT_MESSAGE_ID,
				data: {field},
			};
		} else if (!hasDependency(root, node.value, runtimeDependencyTypes)) {
			yield {
				node,
				messageId: MISSING_MESSAGE_ID,
				data: {name: node.value},
			};
		}
	}
}
