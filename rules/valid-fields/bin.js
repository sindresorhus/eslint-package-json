import path from 'node:path';
import {
	findMember,
	getKey,
	isFalsyValue,
	iterateEffectiveMembers,
	normalizeBinName,
} from '../utils/index.js';

const TYPE_MESSAGE_ID = 'type';
const PATH_TYPE_MESSAGE_ID = 'pathType';
const PATH_EMPTY_MESSAGE_ID = 'pathEmpty';
const CONFLICT_MESSAGE_ID = 'conflict';
const ARRAY_TYPE_MESSAGE_ID = 'arrayType';
const ARRAY_EMPTY_MESSAGE_ID = 'arrayEmpty';
const NAME_DROPPED_MESSAGE_ID = 'nameDropped';
const NAME_RENAMED_MESSAGE_ID = 'nameRenamed';

export const messages = {
	[TYPE_MESSAGE_ID]: 'The `bin` field must be a string, an object mapping command names to file paths, or an array of file paths.',
	[PATH_TYPE_MESSAGE_ID]: 'The `bin` path for `{{name}}` must be a string.',
	[PATH_EMPTY_MESSAGE_ID]: 'The `bin` path for `{{name}}` must not be empty.',
	[CONFLICT_MESSAGE_ID]: 'Use either `bin` or `directories.bin`, not both.',
	[ARRAY_TYPE_MESSAGE_ID]: 'Every entry in a `bin` array must be a file path string.',
	[ARRAY_EMPTY_MESSAGE_ID]: 'A `bin` array entry must not be empty.',
	[NAME_DROPPED_MESSAGE_ID]: '`{{name}}` names no command, so npm drops the `bin` entry, and the `bin` field with it when it was the last one.',
	[NAME_RENAMED_MESSAGE_ID]: '`{{name}}` is published as the command `{{command}}`: npm takes the last path segment of a `bin` name.',
};

/**
The problem npm has with a `bin` name, or `undefined` when it publishes it as written.

Npm reads a name as the basename of the path it normalizes to, so one that normalizes to nothing names no
command at all and the entry goes with it. Only the object form is checked for a rename: its keys are command
names the author spelled out, whereas the array form's entries are paths whose basename is the command name the
legacy shape exists to derive.
*/
function getNameProblem(name, isArrayEntry) {
	const command = normalizeBinName(isArrayEntry ? path.posix.basename(name) : name);

	if (command === '') {
		return {messageId: NAME_DROPPED_MESSAGE_ID, data: {name}};
	}

	return !isArrayEntry && command !== name ? {messageId: NAME_RENAMED_MESSAGE_ID, data: {name, command}} : undefined;
}

export function * check(root) {
	const bin = findMember(root, 'bin');

	if (!bin) {
		return;
	}

	// Npm only reads `directories.bin` when there is no `bin` of its own, so the two together are a
	// mistake worth flagging, but npm publishes the manifest either way. Its guard is `!data.bin`, so a
	// falsy `bin` is what lets `directories.bin` be read and the two are not in conflict. The empty `bin`
	// itself is `no-empty-fields`' business.
	const directories = findMember(root, 'directories');

	if (directories?.value.type === 'Object') {
		const directoriesBin = findMember(directories.value, 'bin');

		if (directoriesBin && !isFalsyValue(bin.value)) {
			yield {
				node: directoriesBin.name,
				messageId: CONFLICT_MESSAGE_ID,
			};
		}
	}

	// The string form (and an empty one) is valid here; `no-empty-fields` flags an empty string.
	if (bin.value.type === 'String') {
		return;
	}

	// The array form is a legacy shape npm still accepts: it flattens the entries into an object keyed
	// by each entry's basename. `path.basename` throws on a non-string, so every entry is still a path.
	if (bin.value.type === 'Array') {
		for (const element of bin.value.elements) {
			if (element.value.type !== 'String') {
				yield {
					node: element.value,
					messageId: ARRAY_TYPE_MESSAGE_ID,
				};
			} else if (element.value.value === '') {
				yield {
					node: element.value,
					messageId: ARRAY_EMPTY_MESSAGE_ID,
				};
			} else {
				const problem = getNameProblem(element.value.value, true);

				if (problem) {
					yield {node: element.value, ...problem};
				}
			}
		}

		return;
	}

	if (bin.value.type !== 'Object') {
		yield {
			node: bin.value,
			messageId: TYPE_MESSAGE_ID,
		};
		return;
	}

	// Effective members, since a shadowed duplicate is not a path npm ever installs.
	for (const member of iterateEffectiveMembers(bin.value)) {
		if (member.value.type !== 'String') {
			yield {
				node: member.value,
				messageId: PATH_TYPE_MESSAGE_ID,
				data: {name: getKey(member)},
			};
			continue;
		}

		if (member.value.value === '') {
			yield {
				node: member.value,
				messageId: PATH_EMPTY_MESSAGE_ID,
				data: {name: getKey(member)},
			};
			continue;
		}

		const problem = getNameProblem(getKey(member), false);

		if (problem) {
			yield {node: member.name, ...problem};
		}
	}
}
