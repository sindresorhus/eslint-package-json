import {findMember, getKey} from '../utils/index.js';

const TYPE_MESSAGE_ID = 'type';
const PATH_TYPE_MESSAGE_ID = 'pathType';
const PATH_EMPTY_MESSAGE_ID = 'pathEmpty';
const CONFLICT_MESSAGE_ID = 'conflict';

export const messages = {
	[TYPE_MESSAGE_ID]: 'The `bin` field must be a string or an object mapping command names to file paths.',
	[PATH_TYPE_MESSAGE_ID]: 'The `bin` path for `{{name}}` must be a string.',
	[PATH_EMPTY_MESSAGE_ID]: 'The `bin` path for `{{name}}` must not be empty.',
	[CONFLICT_MESSAGE_ID]: 'Use either `bin` or `directories.bin`, not both.',
};

export function * check(root) {
	const bin = findMember(root, 'bin');

	if (!bin) {
		return;
	}

	// Setting both `bin` and `directories.bin` is an npm error; `directories.bin` alone is fine.
	const directories = findMember(root, 'directories');

	if (directories?.value.type === 'Object') {
		const directoriesBin = findMember(directories.value, 'bin');

		if (directoriesBin) {
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

	if (bin.value.type !== 'Object') {
		yield {
			node: bin.value,
			messageId: TYPE_MESSAGE_ID,
		};
		return;
	}

	for (const member of bin.value.members) {
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
		}
	}
}
