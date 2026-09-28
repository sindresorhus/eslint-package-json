import fs from 'node:fs';
import path from 'node:path';
import semver from 'semver';
import npa from 'npm-package-arg';
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

The fields npm itself deprecates or ignores (`jsnext:main`, `preferGlobal`, `engineStrict`, `licenses`, `modules`) and third-party tool keys such as `bun` are deliberately left out, so `sort-properties` keeps them with the unknown fields at the end rather than inventing a position for them.
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
	// A legacy plural npm still passes through, next to the singular it duplicates.
	'authors',
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
	// The dependency groups sit in the same order `sort-dependencies` uses by default, so a manifest written
	// the way this plugin documents is not rewritten by `sort-properties`. Npm's own `depTypes` is
	// `dependencies`, `optionalDependencies`, `devDependencies`, `peerDependencies`, which differs on the
	// first pair, but `sort-dependencies` exposes its list as an option and this is its default.
	'dependencies',
	'devDependencies',
	'optionalDependencies',
	'peerDependencies',
	'peerDependenciesMeta',
	// Npm silently renames `bundledDependencies` to `bundleDependencies` on every fix, so both spellings
	// belong next to each other rather than at the end as unknown fields.
	'bundledDependencies',
	'bundleDependencies',
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
	// Common runtime/tool config keys and legacy plurals that are edit-distance 1 from a real field.
	// `authors` is the historical plural of `author`: npm passes it through, and renaming it to `author`
	// hands npm an array where `stringifyPerson` expects one person, which normalizes to `{}`.
	// `licence` is the spelling npm reads a license from when `license` is absent, so it is a field and not
	// a misspelling, however it looks beside `license`.
	'bun',
	'authors',
	'licence',
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
Check whether a resolved path stays within the package directory.
*/
function isWithinPackage(packageDirectory, filePath) {
	const relativePath = path.relative(packageDirectory, filePath);

	return relativePath !== ''
		&& relativePath !== '..'
		&& !relativePath.startsWith(`..${path.sep}`)
		&& !path.isAbsolute(relativePath);
}

/**
Iterate the effective string-valued file paths referenced by `bin`.
*/
function * iterateBinEntries(rootObject) {
	const binMember = findMember(rootObject, 'bin');

	if (binMember?.value.type === 'String') {
		yield {node: binMember.value, value: binMember.value.value};
		return;
	}

	if (binMember?.value.type !== 'Object') {
		return;
	}

	for (const member of iterateEffectiveMembers(binMember.value)) {
		if (member.value.type === 'String') {
			yield {node: member.value, value: member.value.value, name: getKey(member)};
		}
	}
}

/**
Iterate existing regular files referenced by effective `bin` entries, resolving only targets that stay within the physical package directory.
*/
export function * iterateExistingBinFiles(context, rootObject) {
	const {physicalFilename} = context;

	if (physicalFilename.startsWith('<')) {
		return;
	}

	const packageDirectory = path.dirname(path.resolve(context.cwd, physicalFilename));
	let realPackageDirectory;

	for (const entry of iterateBinEntries(rootObject)) {
		const filePath = path.resolve(packageDirectory, entry.value);

		if (!isWithinPackage(packageDirectory, filePath)) {
			continue;
		}

		let realFilePath;

		try {
			realFilePath = fs.realpathSync(filePath);
		} catch {
			continue;
		}

		try {
			realPackageDirectory ??= fs.realpathSync(packageDirectory);
		} catch {
			return;
		}

		if (!isWithinPackage(realPackageDirectory, realFilePath)) {
			continue;
		}

		let statistics;

		try {
			statistics = fs.statSync(realFilePath);
		} catch {
			continue;
		}

		if (!statistics.isFile()) {
			continue;
		}

		yield {...entry, filePath: realFilePath, mode: statistics.mode};
	}
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
Check whether a value node is falsy the way a JavaScript `||` reads it: `null`, `false`, `0`, or the empty string.

Every other JSON value is truthy, an object and an array included, so a member holding one is a value the `||`
takes rather than steps over. Rules that read a field the way npm's `person.url || person.web` or
`!data.bin` do need this, since an AST node is truthy whatever value it holds.
*/
export function isFalsyValue(node) {
	switch (node?.type) {
		case 'Null': {
			return true;
		}

		case 'Boolean': {
			return !node.value;
		}

		case 'Number': {
			return node.value === 0;
		}

		case 'String': {
			return node.value === '';
		}

		default: {
			return false;
		}
	}
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
The version npm publishes for a value `semver` accepts: the surrounding whitespace and the whole leading run of
`=` pins and `v` prefixes go, and the build metadata stays.

`semver.clean` is what npm publishes a version through, and it strips exactly that run, so matching it is what
makes a fix land in one round: stripping one `=` from `=v1.0.0` would leave `v1.0.0` and the rule would report
it again. `semver.valid` and `semver.clean` both drop `+build`, so a rule that rewrites a specifier through
either of them silently removes an identifier the author wrote. A value `semver.clean` rejects is returned as
written, for the caller to report rather than rewrite.
*/
export function canonicalVersion(version) {
	return semver.clean(version) === null ? version : version.trim().replace(/^[=v]+/iu, '').trim();
}

/**
Whether a version range targets a pre-release, decided the way `semver.minVersion` decides it: a range that starts
at a stable version is not a pre-release range, even when a later bound in it carries a pre-release identifier. That
is what `>=1.0.0 <2.0.0-0` is, the range `^1.0.0` normalizes to, where the `-0` upper bound excludes the next major's
pre-releases rather than asking for one.

`loose` reads the range the way `npm-package-arg` does when it resolves a dependency specifier, which accepts a leading zero in a numeric or pre-release identifier where strict SemVer does not, and a pre-release without the hyphen before it (`2.0.0rc1`).
*/
export function targetsPrerelease(range, {loose = false} = {}) {
	// A strict pre-release identifier always contains a hyphen (`1.0.0-beta`), so a range without one cannot resolve to a pre-release. This skips the expensive `minVersion` for the overwhelming majority of ranges. The loose grammar makes the hyphen optional (`2.0.0rc1` is `2.0.0-rc1`), so it gets no shortcut.
	if (!loose && !range.includes('-')) {
		return false;
	}

	try {
		const minimum = semver.minVersion(range, loose);
		return minimum !== null && semver.prerelease(minimum) !== null;
	} catch {
		return false;
	}
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

/*
The segments Node rejects anywhere after the initial `./` of a package target.

An empty segment is deliberately not here: Node resolves `./a//b.js`, only warning about it with DEP0166. It
warns rather than refusing, so calling it invalid would reject a target that works.
*/
const invalidPackageTargetSegments = new Set(['.', '..', 'node_modules']);

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

// A protocol scheme is case-insensitive (RFC 3986), and `npm-package-arg` reads `NPM:` as the same alias.
const aliasPattern = /^npm:/iu;

/**
The package an `npm:` alias installs, resolved the way `npm-package-arg` resolves it, or `undefined` when the
specifier is not an alias or the alias is malformed.

An alias names the package it installs and the range it installs it at, neither of which the alias string itself
says: `npm:foo@*` installs `foo` at any version and `npm:foo@1.2.3` installs exactly one. `name` on the result is
the package it installs and `fetchSpec` the range it installs that at, so a rule that reads either reads it here.
*/
export function resolveAlias(specifier) {
	if (!aliasPattern.test(specifier)) {
		return undefined;
	}

	try {
		return npa.resolve('alias', specifier).subSpec;
	} catch {
		return undefined;
	}
}

/**
The specifier npm actually installs for a dependency entry, which is any alias's own range and everything else
unchanged. An alias `npm-package-arg` cannot parse is returned as written for the caller to reject.
*/
export function installedSpecifier(specifier) {
	return resolveAlias(specifier)?.fetchSpec ?? specifier;
}

/**
Check whether npm resolves a dependency specifier to a git remote. Shared by `no-git-dependencies`, which reports these, and `no-http-dependencies`, which leaves them alone so a git URL is never labelled an HTTP tarball.

`npm-package-arg` decides from the host and the protocol, not from a `.git` suffix, so this catches the shapes no string pattern can: a hosted URL with no `git+` prefix and no `.git` suffix is a remote, as is a hosted `ssh://` one, while `https://example.com/foo.git` is a plain tarball npm downloads over HTTP. An unhosted `ssh://` URL needs the `git+` prefix: without it, `npm-package-arg` refuses the protocol, so it is not a remote.
*/
export function isGitRemote(specifier) {
	try {
		return npa(specifier).type === 'git';
	} catch {
		// `npm-package-arg` throws on protocols it does not know, such as `workspace:` and `link:`.
		return false;
	}
}

// A single `.` subsumes `./foo` and `../foo` as well as `.` and `..`, so those two entries are gone.
// `link:` and `portal:` are the Yarn local-directory protocols.
const localSpecifierPrefixes = ['file:', 'link:', 'portal:', '.', '/', '~/'];
const windowsDrivePattern = /^[a-z]:[/\\]/iu;

/**
Normalize a `bin` path the way npm does before it publishes the target, or `''` when the path names nothing.
Npm turns every `\` and `:` into a path separator, so `scripts\cli.js` and `C:cli.js` are the files
`scripts/cli.js` and `C/cli.js`, and an empty result is a path npm has nowhere to write.
*/
export function normalizeBinPath(value) {
	const unixPath = value.replaceAll(/[:\\]/gu, '/');
	const normalizedPath = path.posix.join('.', path.posix.join('/', unixPath));
	return normalizedPath.startsWith('./') ? '' : normalizedPath;
}

/**
Normalize a `bin` command name the way npm does, which is the basename of the normalized path.
*/
export function normalizeBinName(value) {
	return path.posix.basename(normalizeBinPath(value));
}

// A bare specifier with no protocol is a directory npm copies into `node_modules` as soon as it is three path
// segments long or ends in a slash, because `npm-package-arg` reads a one- or two-segment one as the hosted
// `owner/repo` shorthand instead. The first segment may not hold a colon, which is what tells the two apart.
const bareDirectoryPattern = /^[^/:]+\/(?:[^/]*\/)+[^/]*$/u;
// A single segment with a trailing slash is a directory by that same rule, and it has no second slash for the
// pattern above to find.
const bareDirectorySlashPattern = /^[^/:]+\/$/u;

// Files npm force-includes at the package root whatever `files` says, matched case-insensitively, so a casing
// variant needs no `files` entry either. The family is root-only: a nested `docs/README.md` is not published,
// because the `docs` directory itself stays excluded. `package.json` is the one exact name: npm lists it without
// the suffix the others carry, so `package.json.bak` is an ordinary file a `files` entry does publish.
const alwaysIncludedFilePattern = /^(?:package\.json|(?:readme|copying|licen[cs]e)(?:\.[^/]*[^$/~])?)$/u;

/**
Whether a `files` entry names a file npm includes whatever `files` says, so a `files` entry for it is redundant.

Shared by the rules that report such an entry as redundant and the rule that would otherwise offer to rewrite the
same entry's spelling, which would turn a removable entry into one that stays.
*/
export function isAlwaysIncludedFile(value) {
	// The leading `./` and `/` npm strips from a `files` entry are not part of the name, and its rules match
	// case-insensitively, so a casing variant of these names is included too.
	const normalized = value.replace(/^(?:\.\/|\/)+/u, '').replaceAll(/[A-Z]/gu, character => character.toLowerCase());

	return normalized !== '' && alwaysIncludedFilePattern.test(normalized);
}

/**
Check whether a dependency specifier references the local filesystem.
*/
export function isLocalSpecifier(specifier) {
	return localSpecifierPrefixes.some(prefix => specifier.startsWith(prefix))
		|| windowsDrivePattern.test(specifier)
		|| bareDirectoryPattern.test(specifier)
		|| bareDirectorySlashPattern.test(specifier);
}

/**
The messages a rule must include to use `checkPlatformArray`.
*/
export const platformFieldMessages = field => ({
	type: `The \`${field}\` field must be an array or a string.`,
	elementType: `Each \`${field}\` value must be a string.`,
	invalid: `\`{{value}}\` is not a recognized \`${field}\` value.`,
	any: `\`any\` means no restriction only as the sole \`${field}\` value. Anywhere else npm compares it like a real value, which no platform matches.`,
});

/**
Validate an `os`/`cpu`-style field: an array of platform strings where a leading `!` excludes a value.
*/
export function * checkPlatformArray(rootObject, field, validValues) {
	const member = findMember(rootObject, field);

	if (!member) {
		return;
	}

	// Npm wraps a bare string into a one-element list before checking it, so the string shorthand is a form
	// it supports. Read the value nodes so both forms go through the same loop.
	const values = member.value.type === 'String'
		? [member.value]
		: (member.value.type === 'Array' ? member.value.elements.map(element => element.value) : undefined);

	if (!values) {
		yield {node: member.value, messageId: 'type'};
		return;
	}

	for (const value of values) {
		if (value.type !== 'String') {
			yield {node: value, messageId: 'elementType'};
			continue;
		}

		const name = value.value.startsWith('!') ? value.value.slice(1) : value.value;

		// Npm's `checkList` reads `any` as "no restriction" only when it is the whole list. Anywhere else it compares it as a platform name, so `["any", "!win32"]` matches no platform at all. A negated `!any` excludes a platform nothing is named, so it restricts nothing either way.
		if (name === 'any') {
			if (values.length > 1 && value.value === 'any') {
				yield {node: value, messageId: 'any', data: {value: value.value}};
			}

			continue;
		}

		if (!validValues.has(name)) {
			yield {node: value, messageId: 'invalid', data: {value: value.value}};
		}
	}
}

// Both of these scan the whole document, and fixes ask for them repeatedly, so the result is cached per `SourceCode` (one object per file per lint pass).
const indentStringCache = new WeakMap();

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
Remove `entry` out of the container `containerMember` holds, and when it was the only entry there remove the
container with it.

An empty container is what `no-empty-fields` reports, so a removal that leaves one behind trades the rule's own
report for another's, which is no better than not having removed it at all.

Every caller reaches the container through `findMember`, so it is the final member for its key. Taking only
that one would promote a shadowed duplicate back into its place, which is the very problem the removal was
offered for.
*/
export function * removeEntryAndEmptyContainer(fixer, sourceCode, containerMember, entry) {
	const container = containerMember.value;
	const entryCount = container.type === 'Array'
		? container.elements.length
		: (container.type === 'Object' ? countEffectiveMembers(container) : 0);

	if (entryCount === 1) {
		yield * removeMemberAndDuplicates(fixer, sourceCode, containerMember);
		return;
	}

	if (container.type === 'Array') {
		yield * removeElement(fixer, sourceCode, entry);
		return;
	}

	yield * removeMemberAndDuplicates(fixer, sourceCode, entry);
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
The whitespace after the last line break in `text`, or `undefined` when it holds no line break.

`text` is the whitespace between a container's brackets and its entries, so what follows the last line break is only the indentation. A blank line an author wrote inside the container comes before that break and does not survive the rewrite.
*/
const indentAfterLastLineBreak = text => {
	const index = text.lastIndexOf('\n');
	return index === -1 ? undefined : text.slice(index + 1);
};

/**
Build the source text for an object or array with its entries reordered, preserving the file's existing indentation.

`orderedNodes` are member nodes for an object, or element value nodes for an array, in their new order.
*/
export function buildReordered(sourceCode, containerNode, orderedNodes) {
	const isArray = containerNode.type === 'Array';
	const entryNodes = getEntryNodes(containerNode);
	const newline = '\n';
	const containerIndent = lineIndentOf(sourceCode, containerNode);

	// The entry indentation is whatever follows the last newline before the first entry. A single-line container has none, so one indent level is added to the container's own.
	const textBefore = sourceCode.text.slice(containerNode.range[0] + 1, entryNodes[0].range[0]);
	const entryIndent = indentAfterLastLineBreak(textBefore) ?? (containerIndent + getIndentString(sourceCode));

	const textBeforeClosing = sourceCode.text.slice(entryNodes.at(-1).range[1], containerNode.range[1] - 1);
	const closingIndent = indentAfterLastLineBreak(textBeforeClosing) ?? containerIndent;

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
Get the indentation an object's members sit at, or `undefined` when no member starts its own line, so a member added to it stays on the line of its neighbors. A compact `{"dependencies": {` whose only member's value spans lines counts as that layout.

The indentation comes from the first member that starts its own line rather than from the member an insertion goes next to, since a document can put its first member on the opening line and the rest on lines of their own. A member takes its siblings' indentation rather than the one `detect-indent` infers for the file, which is the most common increase in it rather than the level this object's members sit at. An empty object written across lines gets one level deeper than its own line.
*/
function getMemberIndent(sourceCode, objectNode) {
	const memberOnOwnLine = objectNode.members.find(member => sourceCode.getTokenBefore(member).loc.end.line < member.loc.start.line);

	if (memberOnOwnLine) {
		return lineIndentOf(sourceCode, memberOnOwnLine);
	}

	if (objectNode.members.length === 0 && objectNode.loc.start.line < objectNode.loc.end.line) {
		return lineIndentOf(sourceCode, objectNode) + getIndentString(sourceCode);
	}

	return undefined;
}

/**
Insert the member text `entry` into an object so it becomes the member at `index`, in the object's own layout.
*/
function insertMember(fixer, sourceCode, objectNode, {index, entry}) {
	const {members} = objectNode;
	const indent = getMemberIndent(sourceCode, objectNode);

	if (members.length === 0) {
		// The object holds nothing but whitespace, so the entry replaces that whitespace rather than going in front of it, or the closing indent the author wrote would end up alone on a line.
		const contents = indent === undefined
			? entry
			: `\n${indent}${entry}\n${lineIndentOf(sourceCode, objectNode)}`;

		return fixer.replaceTextRange([objectNode.range[0] + 1, objectNode.range[1] - 1], contents);
	}

	const separator = indent === undefined ? ' ' : `\n${indent}`;

	if (index < members.length) {
		return fixer.insertTextBefore(members[index], `${entry},${separator}`);
	}

	return fixer.insertTextAfter(members.at(-1), `,${separator}${entry}`);
}

/**
Insert a new top-level `key: value` member where a sorted document holds it, so the fix does not leave `sort-properties` reporting the document it just produced. `value` must already be fully-formed JSON text (e.g. via `JSON.stringify`). An empty root, a root written on one line, and a root with its members on their own lines each keep their layout.

The member goes after the last member `fieldOrder` ranks before `key`, or first when there is none. Anchoring on known fields only keeps an unknown field, which `sort-properties` keeps last, from pulling the member to the end. Anchoring on the first field that follows `key` instead would put the member ahead of any earlier field that is merely written out of order, such as an `exports` behind an `engines`.
*/
export function insertRootField(fixer, sourceCode, rootObject, {key, value}) {
	const order = fieldOrder.indexOf(key);
	const anchorIndex = rootObject.members.findLastIndex(member => {
		const memberOrder = fieldOrder.indexOf(getKey(member));
		return memberOrder !== -1 && memberOrder < order;
	});

	return insertMember(fixer, sourceCode, rootObject, {index: anchorIndex + 1, entry: `${JSON.stringify(key)}: ${value}`});
}

/**
Suggest setting the top-level `private` field to `true`, preserving the document's compact or multiline formatting.
*/
export function * setPrivate(fixer, sourceCode, rootObject, privateMember) {
	if (privateMember) {
		yield fixer.replaceText(privateMember.value, 'true');
		return;
	}

	yield insertRootField(fixer, sourceCode, rootObject, {key: 'private', value: 'true'});
}

/**
Insert a new `key: value` member into a dependency-style group object, creating the group as a new top-level member if `groupMember` is absent. `value` must already be fully-formed JSON text (e.g. via `JSON.stringify`).

Both the entry and a created group go where a sorted document holds them, so the fix does not leave `sort-dependencies` or `sort-properties` reporting what it just produced.
*/
export function * insertGroupMember(fixer, sourceCode, root, {
	groupMember, groupName, key, value,
}) {
	const entry = `${JSON.stringify(key)}: ${value}`;

	if (groupMember) {
		const group = groupMember.value;
		const index = group.members.findIndex(member => compareStrings(getKey(member), key) > 0);

		yield insertMember(fixer, sourceCode, group, {index: index === -1 ? group.members.length : index, entry});
		return;
	}

	// The created group nests its entry one level deeper than the root's members, and the root starts at the beginning of its line, so the root's member indentation is that level. `root` always has at least one member: the rule's own trigger (the peer/runtime dependency group) is itself a member of `root`.
	const indent = getMemberIndent(sourceCode, root);
	const group = indent === undefined
		? `{${entry}}`
		: `{\n${indent}${indent}${entry}\n${indent}}`;

	yield insertRootField(fixer, sourceCode, root, {key: groupName, value: group});
}

/**
Get the leading indentation (whitespace) of the line where a node starts, or `''` if the node is not at the start of its line.

A node that shares its line with earlier content is inline, so `''` doubles as the signal to keep an insertion on the same line rather than break it across newlines.
*/
export function getIndentPrefix(sourceCode, node) {
	const {text} = sourceCode;
	const lineStart = text.lastIndexOf('\n', node.range[0] - 1) + 1;
	const linePrefix = text.slice(lineStart, node.range[0]);

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

/**
Yield the path values of a field that is either one path string or a list of them. Only `man` takes that shape.
*/
function * iterateOneOrManyPaths(field, member) {
	if (member?.value.type === 'String') {
		yield {node: member.value, field};
	} else if (member?.value.type === 'Array') {
		for (const element of member.value.elements) {
			if (element.value.type === 'String') {
				yield {node: element.value, field};
			}
		}
	}
}

/**
Yield the `String` values of a flat map of paths. Effective members, since a shadowed duplicate is not a path the manifest holds.
*/
function * iterateMappedPaths(field, objectNode) {
	for (const member of iterateEffectiveMembers(objectNode)) {
		if (member.value.type === 'String') {
			yield {node: member.value, field};
		}
	}
}

function * collectPathValueNodes(rootObject) {
	for (const field of pathFields) {
		const member = findMember(rootObject, field);

		if (member?.value.type === 'String') {
			yield {node: member.value, field};
		} else if (field === 'browser' && member?.value.type === 'Object') {
			// `browser` is the only one of these that also takes a replacement map. The map is flat, and a string value is what it swaps in; a `false` value shims the module out instead of pointing anywhere.
			yield * iterateMappedPaths(field, member.value);
		}
	}

	const bin = findMember(rootObject, 'bin');

	if (bin?.value.type === 'String') {
		yield {node: bin.value, field: 'bin'};
	} else if (bin?.value.type === 'Object') {
		// Effective members, since a shadowed duplicate is not a path npm ever installs.
		yield * iterateMappedPaths('bin', bin.value);
	}

	// Npm 12 rewrites every `man` entry the way it rewrites a `bin` target (`secureAndUnixifyPath` in `@npmcli/package-json`): it drops the leading `/` and turns `\` into `/`, so `/man/foo.1` and `man\foo.1` still name `man/foo.1`. Only a real system path like `/usr/share/man/man1/foo.1` names no file in the package, but the rules still report the leading `/` and the `\` in every `man` entry, since the manifest reads as a machine path either way. Unlike `bin`, `man` is not force-included, so the path is the only thing that decides whether it ships. The field is one path or a list of them.
	yield * iterateOneOrManyPaths('man', findMember(rootObject, 'man'));

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
			// Collapsed the way `JSON.parse` builds the tree, so a shadowed duplicate is not scanned as a path.
			for (const node of iterateStringValues(withoutShadowedMembers(member.value))) {
				yield {node, field};
			}
		}
	}
}

// `no-absolute-paths` and `no-backslash-paths` both walk every path in the manifest, and the same AST is shared between them, so the traversal is materialized once per root and reused.
const pathValueNodesCache = new WeakMap();

/**
Get every path-bearing `String` value node in a package.json as `{node, field}`: the simple path fields, a `browser` replacement map's values, `bin`, `man`, `files` entries, and `exports`/`imports` string targets.

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
