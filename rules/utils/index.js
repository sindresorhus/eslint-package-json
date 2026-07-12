import detectIndent from 'detect-indent';

/**
The standard npm dependency groups, in canonical order.
*/
export const dependencyTypes = [
	'dependencies',
	'devDependencies',
	'optionalDependencies',
	'peerDependencies',
];

/**
The canonical order for known top-level package.json fields.
*/
export const fieldOrder = [
	'name',
	'version',
	'private',
	'description',
	'license',
	'repository',
	'homepage',
	'bugs',
	'funding',
	'author',
	'contributors',
	'maintainers',
	'type',
	'exports',
	'imports',
	'main',
	'module',
	'browser',
	'types',
	'typings',
	'bin',
	'man',
	'directories',
	'sideEffects',
	'engines',
	'devEngines',
	'os',
	'cpu',
	'publishConfig',
	'packageManager',
	'scripts',
	'config',
	'files',
	'workspaces',
	'keywords',
	'dependencies',
	'devDependencies',
	'peerDependencies',
	'peerDependenciesMeta',
	'optionalDependencies',
	'bundledDependencies',
	'overrides',
];

/**
Every recognized top-level field name, including deprecated ones, so typo detection defers to `no-deprecated-fields` rather than flagging them.
*/
export const knownFields = new Set([
	...fieldOrder,
	'jsnext:main',
	'preferGlobal',
	'engineStrict',
	'licenses',
	'modules',
	'bundleDependencies',
	// Common runtime/tool config keys that are edit-distance 1 from a real field.
	'bun',
]);

/**
A JSON Schema fragment for an option that is an array of unique strings.
*/
export const stringArraySchema = {
	type: 'array',
	items: {
		type: 'string',
	},
	uniqueItems: true,
};

/**
Build a rule's `schema` for a single options object with the given properties and no extras.
*/
export const optionsSchema = properties => [
	{
		type: 'object',
		properties,
		additionalProperties: false,
	},
];

/**
Get the key string of an object member. In strict JSON the key is always a string node.
*/
export function getKey(member) {
	return member.name.value;
}

/**
Get the top-level object node of a package.json document, or `undefined` if the root is not an object.
*/
export function getRootObject(document) {
	const root = document.body;
	return root?.type === 'Object' ? root : undefined;
}

/**
Find the final member by key in an object node, matching JSON parsing semantics, or `undefined`.
*/
export function findMember(objectNode, key) {
	return objectNode?.members.findLast(member => getKey(member) === key);
}

/**
Check whether the package is private, i.e. has `"private": true`.
*/
export function isPrivatePackage(rootObject) {
	const member = findMember(rootObject, 'private');
	return member?.value.type === 'Boolean' && member.value.value === true;
}

/**
Iterate the effective dependency entries across the given dependency groups that are present as objects.

Yields `{groupName, group, member, name}` where `group` is the group member (e.g. the `dependencies` member) and `member` is an individual `name: range` entry.
*/
export function * iterateDependencies(rootObject, types = dependencyTypes) {
	for (const groupName of types) {
		const group = findMember(rootObject, groupName);
		if (group?.value.type === 'Object') {
			const effectiveMembers = new Map();

			for (const member of group.value.members) {
				effectiveMembers.set(getKey(member), member);
			}

			for (const [name, member] of effectiveMembers) {
				yield {
					groupName, group, member, name,
				};
			}
		}
	}
}

const globPattern = /[*?[{]/;

/**
Check whether a path-like string contains glob characters (`*`, `?`, `[`, `{`).
*/
export function hasGlob(value) {
	return globPattern.test(value);
}

/**
Check whether a string is a valid `http(s)` URL.
*/
export function isHttpUrl(string) {
	let url;

	try {
		url = new URL(string);
	} catch {
		return false;
	}

	return url.protocol === 'http:' || url.protocol === 'https:';
}

/**
A `.git` suffix, optionally followed by a `#ref`, marking a git repository URL. Shared by `no-git-dependencies` and `no-http-dependencies`.
*/
export const gitSuffixPattern = /\.git(?:#.+)?$/;

/**
The messages a rule must include to use `checkPlatformArray`.
*/
export const platformFieldMessages = field => ({
	type: `The \`${field}\` field must be an array.`,
	elementType: `Each \`${field}\` value must be a string.`,
	invalid: `\`{{value}}\` is not a recognized \`${field}\` value.`,
	mixing: `Do not mix included and excluded (\`!\`-prefixed) \`${field}\` values.`,
});

/**
Validate an `os`/`cpu`-style field: an array of platform strings where a leading `!` excludes a value. Yields reports for unrecognized values and for mixing included and excluded entries.
*/
export function * checkPlatformArray(rootObject, field, validValues) {
	const member = findMember(rootObject, field);

	if (!member) {
		return;
	}

	if (member.value.type !== 'Array') {
		yield {node: member.value, messageId: 'type'};
		return;
	}

	let hasIncluded = false;
	let hasExcluded = false;

	for (const element of member.value.elements) {
		if (element.value.type !== 'String') {
			yield {node: element.value, messageId: 'elementType'};
			continue;
		}

		const {value} = element.value;
		const excluded = value.startsWith('!');

		if (excluded) {
			hasExcluded = true;
		} else {
			hasIncluded = true;
		}

		if (!validValues.has(excluded ? value.slice(1) : value)) {
			yield {node: element.value, messageId: 'invalid', data: {value}};
		}
	}

	if (hasIncluded && hasExcluded) {
		yield {node: member.value, messageId: 'mixing'};
	}
}

/**
Detect the indentation string used by the document, defaulting to a tab.
*/
export function getIndentString(sourceCode) {
	return detectIndent(sourceCode.text).indent || '\t';
}

/**
Detect the LF or CRLF newline sequence used by the document, defaulting to `\n`.
*/
export function getNewline(sourceCode) {
	return sourceCode.text.includes('\r\n') ? '\r\n' : '\n';
}

/**
Remove an object member along with its adjacent comma, keeping the surrounding JSON valid and tidy.
*/
export function * removeMember(fixer, sourceCode, member) {
	const tokenBefore = sourceCode.getTokenBefore(member);
	const tokenAfter = sourceCode.getTokenAfter(member);

	if (tokenAfter?.type === 'Comma') {
		// Not the last member: remove the member, its trailing comma, and the gap before the next member. Each member keeps its own leading whitespace, so the next member's indentation stays intact on every line layout.
		const nextToken = sourceCode.getTokenAfter(tokenAfter);
		yield fixer.removeRange([member.range[0], nextToken.range[0]]);
	} else if (tokenBefore?.type === 'Comma') {
		// Last member with siblings: remove the preceding comma and the member.
		yield fixer.removeRange([tokenBefore.range[0], member.range[1]]);
	} else {
		// Only member: clear everything between the braces.
		yield fixer.removeRange([tokenBefore.range[1], tokenAfter.range[0]]);
	}
}

/**
Remove an array element along with its adjacent comma, keeping the surrounding JSON valid and tidy.

`Element` nodes carry no range, so the element's value node is used for token and range lookups.
*/
export function * removeElement(fixer, sourceCode, element) {
	const valueNode = element.value;
	const tokenBefore = sourceCode.getTokenBefore(valueNode);
	const tokenAfter = sourceCode.getTokenAfter(valueNode);

	if (tokenAfter?.type === 'Comma') {
		// Not the last element: remove the element, its trailing comma, and the gap before the next element. Each element keeps its own leading whitespace, so the next element's indentation stays intact on every line layout.
		const nextToken = sourceCode.getTokenAfter(tokenAfter);
		yield fixer.removeRange([valueNode.range[0], nextToken.range[0]]);
	} else if (tokenBefore?.type === 'Comma') {
		// Last element with siblings: remove the preceding comma and the element.
		yield fixer.removeRange([tokenBefore.range[0], valueNode.range[1]]);
	} else {
		// Only element: clear everything between the brackets.
		yield fixer.removeRange([tokenBefore.range[1], tokenAfter.range[0]]);
	}
}

/**
Build the source text for an object with its members reordered, preserving the file's existing indentation and newline.
*/
export function buildReorderedObject(sourceCode, objectNode, orderedMembers) {
	const newline = getNewline(sourceCode);
	const indent = getIndentString(sourceCode);
	const objectIndent = lineIndentOf(sourceCode, objectNode);

	// The member indentation is whatever follows the last newline before the first member.
	const firstMemberStart = objectNode.members[0].range[0];
	const textBefore = sourceCode.text.slice(objectNode.range[0] + 1, firstMemberStart);
	const hasExistingMemberIndent = textBefore.includes('\n');
	const existingIndent = hasExistingMemberIndent
		? textBefore.slice(textBefore.lastIndexOf('\n') + 1)
		: '';
	const memberIndent = hasExistingMemberIndent ? existingIndent : objectIndent + indent;
	const lastMemberEnd = objectNode.members.at(-1).range[1];
	const textBeforeClosing = sourceCode.text.slice(lastMemberEnd, objectNode.range[1] - 1);
	const closingIndent = textBeforeClosing.includes('\n')
		? textBeforeClosing.slice(textBeforeClosing.lastIndexOf('\n') + 1)
		: objectIndent;

	return '{'
		+ newline
		+ orderedMembers.map(member => memberIndent + sourceCode.getText(member)).join(',' + newline)
		+ newline
		+ closingIndent
		+ '}';
}

/**
Check whether two member lists are already in the same key order.
*/
export function isSameOrder(members, orderedMembers) {
	return members.every((member, index) => member === orderedMembers[index]);
}

/**
Get the indentation (leading whitespace) of the line a node starts on.
*/
export function lineIndentOf(sourceCode, node) {
	return sourceCode.lines[node.loc.start.line - 1].match(/^(\s*)/u)[1];
}

/**
Insert a new `key: value` member into a dependency-style group object, creating the group as a new top-level member if `groupMember` is absent. `value` must already be fully-formed JSON text (e.g. via `JSON.stringify`).
*/
export function * insertGroupMember(fixer, sourceCode, root, {
	groupMember, groupName, key, value,
}) {
	const newline = getNewline(sourceCode);
	const entryText = `${JSON.stringify(key)}: ${value}`;

	if (groupMember) {
		const group = groupMember.value;

		if (group.members.length === 0) {
			const outerIndent = lineIndentOf(sourceCode, groupMember);
			const memberIndent = outerIndent + getIndentString(sourceCode);
			yield fixer.insertTextAfterRange([group.range[0], group.range[0] + 1], `${newline}${memberIndent}${entryText}${newline}${outerIndent}`);
			return;
		}

		const prefix = getIndentPrefix(sourceCode, group.members[0]);
		// A single-line group has no per-member indent, so keep the new member on the same line.
		const separator = prefix === '' ? ' ' : newline + prefix;
		yield fixer.insertTextAfter(group.members.at(-1), `,${separator}${entryText}`);
		return;
	}

	const indent = getIndentString(sourceCode);
	const groupKey = JSON.stringify(groupName);

	// `root` always has at least one member: the rule's own trigger (the peer/runtime dependency group) is itself a member of `root`.
	yield fixer.insertTextAfter(root.members.at(-1), `,${newline}${indent}${groupKey}: {${newline}${indent}${indent}${entryText}${newline}${indent}}`);
}

/**
Get the leading indentation (whitespace) of the line where a node starts, or `''` if the node is not at the start of its line.
*/
function getIndentPrefix(sourceCode, node) {
	const {text} = sourceCode;
	const start = node.range[0];
	let lineStart = start;

	while (lineStart > 0 && text[lineStart - 1] !== '\n') {
		lineStart--;
	}

	const linePrefix = text.slice(lineStart, start);

	return /^\s*$/.test(linePrefix) ? linePrefix : '';
}

/**
Move an object member to just before or after an anchor member (a sibling), keeping the JSON comma-correct and indented.
*/
function * moveMemberFix(fixer, sourceCode, {member, anchor, position}) {
	const memberText = sourceCode.getText(member);

	yield * removeMember(fixer, sourceCode, member);

	const prefix = getIndentPrefix(sourceCode, anchor);
	// A single-line object has no per-member indent, so keep the moved member on the same line.
	const separator = prefix === '' ? ' ' : getNewline(sourceCode) + prefix;

	yield (position === 'after' ? fixer.insertTextAfter(anchor, ',' + separator + memberText) : fixer.insertTextBefore(anchor, memberText + ',' + separator));
}

/**
Find ordering violations among the conditions of an `exports`/`imports` object: `types` should be first, `module` should precede `require`, and `default` must be last.
*/
function getConditionOrderProblems(objectNode) {
	const {members} = objectNode;
	const problems = [];

	if (members.length === 0) {
		return problems;
	}

	const indexOf = name => members.findIndex(member => getKey(member) === name);

	const defaultIndex = indexOf('default');

	if (defaultIndex !== -1 && defaultIndex !== members.length - 1) {
		const lastOther = members.findLast(member => getKey(member) !== 'default');
		problems.push({
			kind: 'defaultLast', member: members[defaultIndex], anchor: lastOther, position: 'after',
		});
	}

	const typesIndex = indexOf('types');

	if (typesIndex > 0) {
		problems.push({
			kind: 'typesFirst', member: members[typesIndex], anchor: members[0], position: 'before',
		});
	}

	const moduleIndex = indexOf('module');
	const requireIndex = indexOf('require');

	if (moduleIndex !== -1 && requireIndex !== -1 && moduleIndex > requireIndex) {
		problems.push({
			kind: 'moduleBeforeRequire', member: members[moduleIndex], anchor: members[requireIndex], position: 'before',
		});
	}

	return problems;
}

// The shared message and suggestion ids for condition ordering, defined in every rule that uses `checkConditionOrder`.
const conditionOrderIds = {
	defaultLast: {messageId: 'defaultLast', suggestionId: 'moveDefaultLast'},
	typesFirst: {messageId: 'typesFirst', suggestionId: 'moveTypesFirst'},
	moduleBeforeRequire: {messageId: 'moduleBeforeRequire', suggestionId: 'moveModuleBeforeRequire'},
};

/**
The messages a rule must include to use `checkConditionOrder`.
*/
export const conditionOrderMessages = {
	defaultLast: 'The `default` condition must be last.',
	typesFirst: 'The `types` condition should be first.',
	moduleBeforeRequire: 'The `module` condition should come before `require`.',
	moveDefaultLast: 'Move `default` to the end.',
	moveTypesFirst: 'Move `types` to the front.',
	moveModuleBeforeRequire: 'Move `module` before `require`.',
};

/**
Yield reports (with reordering suggestions) for condition-ordering problems in an `exports`/`imports` object.
*/
export function * checkConditionOrder(sourceCode, objectNode) {
	for (const problem of getConditionOrderProblems(objectNode)) {
		const {messageId, suggestionId} = conditionOrderIds[problem.kind];

		yield {
			node: problem.member,
			messageId,
			suggest: [
				{
					messageId: suggestionId,
					* fix(fixer) {
						yield * moveMemberFix(fixer, sourceCode, problem);
					},
				},
			],
		};
	}
}

/**
Recurse a value node (an `exports`/`imports` tree) yielding every `String` value node.
*/
function * iterateStringValues(node) {
	switch (node.type) {
		case 'String': {
			yield node;
			break;
		}

		case 'Object': {
			for (const member of node.members) {
				yield * iterateStringValues(member.value);
			}

			break;
		}

		case 'Array': {
			for (const element of node.elements) {
				yield * iterateStringValues(element.value);
			}

			break;
		}
	// No default
	}
}

/**
The simple top-level fields whose value is a single path string.
*/
export const pathFields = ['main', 'module', 'browser', 'types', 'typings'];

/**
Yield every path-bearing `String` value node in a package.json: the simple path fields, `bin`, `files` entries, and `exports`/`imports` string targets.
*/
export function * iteratePathValueNodes(rootObject) {
	for (const field of pathFields) {
		const member = findMember(rootObject, field);

		if (member?.value.type === 'String') {
			yield member.value;
		}
	}

	const bin = findMember(rootObject, 'bin');

	if (bin?.value.type === 'String') {
		yield bin.value;
	} else if (bin?.value.type === 'Object') {
		for (const member of bin.value.members) {
			if (member.value.type === 'String') {
				yield member.value;
			}
		}
	}

	const files = findMember(rootObject, 'files');

	if (files?.value.type === 'Array') {
		for (const element of files.value.elements) {
			if (element.value.type === 'String') {
				yield element.value;
			}
		}
	}

	for (const field of ['exports', 'imports']) {
		const member = findMember(rootObject, field);

		if (member) {
			yield * iterateStringValues(member.value);
		}
	}
}

/**
The message a rule must include to use `checkKeyConsistency`.
*/
export const keyConsistencyMessages = {
	keyMixing: 'Cannot mix subpath keys and condition keys; `{{key}}` does not match its siblings.',
};

/**
Yield reports for an `exports`/`imports` object that mixes subpath keys (starting with `subpathPrefix`) and condition keys, which is invalid.
*/
export function * checkKeyConsistency(objectNode, subpathPrefix) {
	const {members} = objectNode;

	if (members.length === 0) {
		return;
	}

	const firstIsSubpath = getKey(members[0]).startsWith(subpathPrefix);

	for (const member of members) {
		if (getKey(member).startsWith(subpathPrefix) !== firstIsSubpath) {
			yield {
				node: member.name,
				messageId: 'keyMixing',
				data: {key: getKey(member)},
			};
		}
	}
}
