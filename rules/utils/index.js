import semver from 'semver';
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

// Around sixty rules look up the same handful of keys on the one AST that ESLint shares between them, and every lookup would otherwise scan the object's members. Indexing each object on first use turns the whole pass into hash lookups. A `WeakMap` keeps an index alive no longer than the node it describes.
const memberIndexCache = new WeakMap();

/**
Index an object's members by key exactly as `JSON.parse` would build the object: setting a key that is already present overwrites its value but keeps its original position, so the map ends up holding each key's final member in its first appearance's place.
*/
function getMemberIndex(objectNode) {
	let index = memberIndexCache.get(objectNode);

	if (!index) {
		index = new Map();

		for (const member of objectNode.members) {
			index.set(getKey(member), member);
		}

		memberIndexCache.set(objectNode, index);
	}

	return index;
}

/**
Find the final member by key in an object node, matching JSON parsing semantics, or `undefined`.

Any non-object node simply has no members, so callers can pass a value node whose type they have not narrowed yet.
*/
export function findMember(objectNode, key) {
	if (!objectNode?.members) {
		return undefined;
	}

	return getMemberIndex(objectNode).get(key);
}

/**
Iterate an object's effective members: one per key, the final duplicate, in the order the parsed object would list them.

Use this instead of `objectNode.members` whenever a rule asks what the object *means* — whether any target resolves, which condition matches first — since a shadowed duplicate is not part of the object npm and Node see. Keep plain `members` when reporting on each entry the author wrote.
*/
export function iterateEffectiveMembers(objectNode) {
	return getMemberIndex(objectNode).values();
}

/**
Count an object's distinct keys, so a key repeated with a different value still counts once.
*/
export function countEffectiveMembers(objectNode) {
	return getMemberIndex(objectNode).size;
}

const collapsedNodeCache = new WeakMap();

/**
Get a view of a value node with duplicate object keys collapsed the way `JSON.parse` does.

A rule that asks what an `exports`/`imports` tree *means* should traverse this rather than the raw node, so a shadowed duplicate cannot answer a question about the object npm and Node actually see. Every surviving node is the original, so reports still point at real source ranges, and a tree with no duplicates is returned unchanged.
*/
export function withoutShadowedMembers(node) {
	if (node.type !== 'Object' && node.type !== 'Array') {
		return node;
	}

	let collapsed = collapsedNodeCache.get(node);

	if (collapsed) {
		return collapsed;
	}

	if (node.type === 'Array') {
		const elements = node.elements.map(element => {
			const value = withoutShadowedMembers(element.value);
			return value === element.value ? element : {...element, value};
		});

		collapsed = isSameOrder(node.elements, elements) ? node : {...node, elements};
	} else {
		const members = [...iterateEffectiveMembers(node)].map(member => {
			const value = withoutShadowedMembers(member.value);
			return value === member.value ? member : {...member, value};
		});

		// `isSameOrder` compares lengths too, so a collapsed duplicate is caught as well as a reordering.
		collapsed = isSameOrder(node.members, members) ? node : {...node, members};
	}

	collapsedNodeCache.set(node, collapsed);
	return collapsed;
}

/**
Check whether the package is private, i.e. has `"private": true`.
*/
export function isPrivatePackage(rootObject) {
	const member = findMember(rootObject, 'private');
	return member?.value.type === 'Boolean' && member.value.value === true;
}

function * collectDependencies(rootObject, types) {
	for (const groupName of types) {
		const group = findMember(rootObject, groupName);
		if (group?.value.type === 'Object') {
			for (const member of iterateEffectiveMembers(group.value)) {
				yield {
					groupName, group, member, name: getKey(member),
				};
			}
		}
	}
}

// ESLint parses a file once and shares that AST with every rule, so entries derived from a root object are computed once and cached on it. A `WeakMap` keeps them alive no longer than the AST itself.
const dependenciesCache = new WeakMap();

/**
Iterate the effective dependency entries across the given dependency groups that are present as objects.

Returns a frozen array of `{groupName, group, member, name}`, where `group` is the group member (e.g. the `dependencies` member) and `member` is an individual `name: range` entry.
*/
export function iterateDependencies(rootObject, types = dependencyTypes) {
	let entriesByTypes = dependenciesCache.get(rootObject);

	if (!entriesByTypes) {
		entriesByTypes = new Map();
		dependenciesCache.set(rootObject, entriesByTypes);
	}

	// Dependency group names never contain a comma, so joining them is an unambiguous cache key.
	const cacheKey = types.join(',');
	let entries = entriesByTypes.get(cacheKey);

	if (!entries) {
		// Frozen because every rule linting the file shares this array: an in-place `sort()` or `reverse()` by one rule would otherwise corrupt it for the rest.
		entries = Object.freeze([...collectDependencies(rootObject, types)]);
		entriesByTypes.set(cacheKey, entries);
	}

	return entries;
}

// `String#localeCompare` resolves the runtime's default locale, so the same file sorts differently depending on `LANG` and on whether Node was built with full ICU. That makes an autofix disagree between a contributor's machine and CI, so the collator is pinned to one locale.
const collator = new Intl.Collator('en');

/**
Compare two strings alphabetically, identically on every machine and locale.
*/
export function compareStrings(first, second) {
	return collator.compare(first, second);
}

const globPattern = /[*?[{]/;

/**
Check whether a path-like string contains glob characters (`*`, `?`, `[`, `{`).
*/
export function hasGlob(value) {
	return globPattern.test(value);
}

// `semver.validRange` and `semver.valid` parse the string on every call. Several rules ask about the same specifier, and the same specifiers recur across every package in a workspace, so the answers are memoized. The limit keeps long-lived ESLint processes from retaining every specifier forever.
const semverCacheLimit = 1000;
const validRangeCache = new Map();
const validVersionCache = new Map();

/**
Get a cached SemVer result, evicting the oldest entry when the cache reaches its limit.
*/
function getCachedSemverValue(cache, value, parse) {
	let normalized = cache.get(value);

	if (normalized !== undefined) {
		return normalized;
	}

	normalized = parse(value);

	if (cache.size >= semverCacheLimit) {
		cache.delete(cache.keys().next().value);
	}

	cache.set(value, normalized);
	return normalized;
}

/**
Like `semver.validRange`, returning the normalized range or `null`, but memoized across rules and files.
*/
export function validRange(range) {
	return getCachedSemverValue(validRangeCache, range, semver.validRange);
}

/**
Like `semver.valid`, returning the normalized version or `null`, but memoized across rules and files.
*/
export function validVersion(version) {
	return getCachedSemverValue(validVersionCache, version, semver.valid);
}

/**
Decode a percent-encoded string, or `undefined` when it contains a malformed escape that `decodeURIComponent` rejects.
*/
export function tryDecodeUriComponent(value) {
	try {
		return decodeURIComponent(value);
	} catch {
		return undefined;
	}
}

// The segments Node rejects anywhere after the initial `./` of a package target.
const invalidPackageTargetSegments = new Set(['', '.', '..', 'node_modules']);

/**
Check whether a package target contains a path segment that Node rejects after the initial `./`.
*/
export function hasInvalidPackageTargetSegment(value) {
	if (!value.startsWith('./')) {
		return false;
	}

	const segments = value.slice(2).split(/[/\\]/u);

	return segments.some((segment, index) => {
		// Deprecated trailing-slash mappings are owned by `no-exports-trailing-slash`.
		if (segment === '' && value.endsWith('/') && index === segments.length - 1) {
			return false;
		}

		const decodedSegment = tryDecodeUriComponent(segment);

		// A malformed escape is a segment Node rejects.
		if (decodedSegment === undefined) {
			return true;
		}

		return [segment, decodedSegment].some(candidate => invalidPackageTargetSegments.has(candidate.toLowerCase()))
			|| decodedSegment.includes('/')
			|| decodedSegment.includes('\\');
	});
}

/**
Check whether a string is an ECMAScript array index property key.
*/
export function isArrayIndexKey(value) {
	if (value !== '0' && !/^[1-9]\d*$/u.test(value)) {
		return false;
	}

	const number = Number(value);
	return Number.isSafeInteger(number) && number < ((2 ** 32) - 1);
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
});

/**
Validate an `os`/`cpu`-style field: an array of platform strings where a leading `!` excludes a value.
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

	for (const element of member.value.elements) {
		if (element.value.type !== 'String') {
			yield {node: element.value, messageId: 'elementType'};
			continue;
		}

		const {value} = element.value;
		const excluded = value.startsWith('!');

		if (!validValues.has(excluded ? value.slice(1) : value)) {
			yield {node: element.value, messageId: 'invalid', data: {value}};
		}
	}
}

// Both of these scan the whole document, and fixes ask for them repeatedly, so the result is cached per `SourceCode` (one object per file per lint pass).
const indentStringCache = new WeakMap();
const newlineCache = new WeakMap();

/**
Detect the indentation string used by the document, defaulting to a tab.
*/
export function getIndentString(sourceCode) {
	let indent = indentStringCache.get(sourceCode);

	if (indent === undefined) {
		indent = detectIndent(sourceCode.text).indent || '\t';
		indentStringCache.set(sourceCode, indent);
	}

	return indent;
}

/**
Detect the LF or CRLF newline sequence used by the document, defaulting to `\n`.
*/
export function getNewline(sourceCode) {
	let newline = newlineCache.get(sourceCode);

	if (newline === undefined) {
		newline = sourceCode.text.includes('\r\n') ? '\r\n' : '\n';
		newlineCache.set(sourceCode, newline);
	}

	return newline;
}

/**
Remove a set of an object's members, keeping the surrounding JSON valid and tidy.

Members are removed a contiguous run at a time. Removing them one by one would not work: each removal also consumes an adjacent comma, so two neighboring members would produce overlapping ranges and ESLint rejects a report whose fixes overlap.
*/
export function * removeMembers(fixer, sourceCode, objectNode, membersToRemove) {
	const {members} = objectNode;
	const targets = new Set(membersToRemove);

	if (targets.size === 0) {
		return;
	}

	// Asking what survives, rather than comparing set sizes, keeps this correct even if the caller passes a member twice or one belonging to another object.
	if (members.every(member => targets.has(member))) {
		// Everything goes: clear the space between the braces.
		yield fixer.removeRange([
			sourceCode.getTokenBefore(members[0]).range[1],
			sourceCode.getTokenAfter(members.at(-1)).range[0],
		]);
		return;
	}

	for (let index = 0; index < members.length; index++) {
		if (!targets.has(members[index])) {
			continue;
		}

		let end = index;
		while (end + 1 < members.length && targets.has(members[end + 1])) {
			end++;
		}

		if (end === members.length - 1) {
			// The run reaches the final member, so it takes the comma that precedes it. Something is kept before the run, or the whole-object branch above would have run.
			yield fixer.removeRange([
				sourceCode.getTokenBefore(members[index]).range[0],
				members[end].range[1],
			]);
		} else {
			// Otherwise the run takes its own trailing comma and the gap up to the next kept member. Each member keeps its own leading whitespace, so that member's indentation stays intact on every line layout.
			const comma = sourceCode.getTokenAfter(members[end]);
			yield fixer.removeRange([
				members[index].range[0],
				sourceCode.getTokenAfter(comma).range[0],
			]);
		}

		index = end;
	}
}

/**
Remove a single object member along with its adjacent comma.
*/
export function * removeMember(fixer, sourceCode, member) {
	yield * removeMembers(fixer, sourceCode, sourceCode.getParent(member), [member]);
}

/**
Get a member's containing object along with every member in it sharing its key, `member` itself included.
*/
function getMembersSharingKey(sourceCode, member) {
	const objectNode = sourceCode.getParent(member);
	const key = getKey(member);

	return {objectNode, sharing: objectNode.members.filter(candidate => getKey(candidate) === key)};
}

/**
Remove an object member together with every other member sharing its key.

`findMember` resolves a key to its final member, matching `JSON.parse`. Removing only that one would promote an earlier duplicate into its place, so the reported problem would survive its own fix.
*/
export function * removeMemberAndDuplicates(fixer, sourceCode, member) {
	const {objectNode, sharing} = getMembersSharingKey(sourceCode, member);

	yield * removeMembers(fixer, sourceCode, objectNode, sharing);
}

/**
Remove the members shadowed by `member` — the earlier duplicates sharing its key — leaving `member` itself in place.

Pair this with a fix that rewrites the effective member instead of deleting it. Renaming or replacing only that member would promote a shadowed duplicate into its place under the old key.
*/
export function * removeShadowedDuplicates(fixer, sourceCode, member) {
	const {objectNode, sharing} = getMembersSharingKey(sourceCode, member);

	yield * removeMembers(fixer, sourceCode, objectNode, sharing.filter(candidate => candidate !== member));
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
Get the printable nodes of an object or array: an object's members, or an array's element values, since `Element` nodes carry no range of their own.
*/
function getEntryNodes(containerNode) {
	return containerNode.type === 'Array'
		? containerNode.elements.map(element => element.value)
		: containerNode.members;
}

/**
Build the source text for an object or array with its entries reordered, preserving the file's existing indentation and newline.

`orderedNodes` are member nodes for an object, or element value nodes for an array, in their new order.
*/
export function buildReordered(sourceCode, containerNode, orderedNodes) {
	const isArray = containerNode.type === 'Array';
	const entryNodes = getEntryNodes(containerNode);
	const newline = getNewline(sourceCode);
	const containerIndent = lineIndentOf(sourceCode, containerNode);

	// The entry indentation is whatever follows the last newline before the first entry. A single-line container has none, so one indent level is added to the container's own.
	const textBefore = sourceCode.text.slice(containerNode.range[0] + 1, entryNodes[0].range[0]);
	const entryIndent = textBefore.includes('\n')
		? textBefore.slice(textBefore.lastIndexOf('\n') + 1)
		: containerIndent + getIndentString(sourceCode);

	const textBeforeClosing = sourceCode.text.slice(entryNodes.at(-1).range[1], containerNode.range[1] - 1);
	const closingIndent = textBeforeClosing.includes('\n')
		? textBeforeClosing.slice(textBeforeClosing.lastIndexOf('\n') + 1)
		: containerIndent;

	return (isArray ? '[' : '{')
		+ newline
		+ orderedNodes.map(node => entryIndent + sourceCode.getText(node)).join(',' + newline)
		+ newline
		+ closingIndent
		+ (isArray ? ']' : '}');
}

/**
Check whether a list of entries is already exactly the given list, in the same order.

A differing length counts as a difference, so `withoutShadowedMembers` can use this to detect a collapsed duplicate rather than only a reordering.
*/
export function isSameOrder(entries, orderedEntries) {
	return entries.length === orderedEntries.length
		&& entries.every((entry, index) => entry === orderedEntries[index]);
}

/**
Get the indentation (leading whitespace) of the line a node starts on.
*/
export function lineIndentOf(sourceCode, node) {
	return sourceCode.lines[node.loc.start.line - 1].match(/^(\s*)/u)[1];
}

/**
Suggest setting the top-level `private` field to `true`, preserving the document's compact or multiline formatting.
*/
export function * setPrivate(fixer, sourceCode, rootObject, privateMember) {
	if (privateMember) {
		yield fixer.replaceText(privateMember.value, 'true');
		return;
	}

	const newline = getNewline(sourceCode);
	const lastMember = rootObject.members.at(-1);

	if (lastMember) {
		const hasMultilineMembers = sourceCode.text.slice(rootObject.range[0], lastMember.range[0]).includes('\n');
		const separator = hasMultilineMembers
			? `,${newline}${lineIndentOf(sourceCode, lastMember)}`
			: ', ';

		yield fixer.insertTextAfter(lastMember, `${separator}"private": true`);
		return;
	}

	const contents = sourceCode.text.slice(rootObject.range[0] + 1, rootObject.range[1] - 1);

	if (!contents.includes('\n')) {
		yield fixer.replaceText(rootObject, '{"private": true}');
		return;
	}

	yield fixer.replaceText(rootObject, `{${newline}${getIndentString(sourceCode)}"private": true${newline}}`);
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

A node that shares its line with earlier content is inline, so `''` doubles as the signal to keep an insertion on the same line rather than break it across newlines.
*/
export function getIndentPrefix(sourceCode, node) {
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
Recurse a value node (an `exports`/`imports` tree) yielding every `String` value node.
*/
export function * iterateStringValues(node) {
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

function * collectPathValueNodes(rootObject) {
	for (const field of pathFields) {
		const member = findMember(rootObject, field);

		if (member?.value.type === 'String') {
			yield {node: member.value, field};
		}
	}

	const bin = findMember(rootObject, 'bin');

	if (bin?.value.type === 'String') {
		yield {node: bin.value, field: 'bin'};
	} else if (bin?.value.type === 'Object') {
		for (const member of bin.value.members) {
			if (member.value.type === 'String') {
				yield {node: member.value, field: 'bin'};
			}
		}
	}

	const files = findMember(rootObject, 'files');

	if (files?.value.type === 'Array') {
		for (const element of files.value.elements) {
			if (element.value.type === 'String') {
				yield {node: element.value, field: 'files'};
			}
		}
	}

	for (const field of ['exports', 'imports']) {
		const member = findMember(rootObject, field);

		if (member) {
			for (const node of iterateStringValues(member.value)) {
				yield {node, field};
			}
		}
	}
}

// `no-absolute-paths` and `no-backslash-paths` both walk every path in the manifest, and the same AST is shared between them, so the traversal is materialized once per root and reused.
const pathValueNodesCache = new WeakMap();

/**
Get every path-bearing `String` value node in a package.json as `{node, field}`: the simple path fields, `bin`, `files` entries, and `exports`/`imports` string targets.

The `field` says which top-level field the path came from, because the same text does not mean the same thing everywhere — a leading `/` is an absolute path in `main` but a package-root anchor in `files`.
*/
export function iteratePathValueNodes(rootObject) {
	let nodes = pathValueNodesCache.get(rootObject);

	if (!nodes) {
		// Frozen because both rules linting the file share this array; neither should be able to mutate it for the other.
		nodes = Object.freeze([...collectPathValueNodes(rootObject)]);
		pathValueNodesCache.set(rootObject, nodes);
	}

	return nodes;
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
