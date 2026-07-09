import {findMember, iterateDependencies} from '../utils/index.js';

const TYPE_MESSAGE_ID = 'type';
const ELEMENT_MESSAGE_ID = 'element';
const MISSING_MESSAGE_ID = 'missing';

export const messages = {
	[TYPE_MESSAGE_ID]: 'The `{{field}}` field must be an array.',
	[ELEMENT_MESSAGE_ID]: 'Each `{{field}}` entry must be a string.',
	[MISSING_MESSAGE_ID]: '`{{name}}` is bundled but not listed in `dependencies` or `optionalDependencies`.',
};

// Both spellings are treated as equivalent by npm.
const fields = ['bundledDependencies', 'bundleDependencies'];

export function * check(root) {
	// A bundled package must be a real runtime dependency (`devDependencies` are not published).
	const dependencies = new Set();

	for (const {name} of iterateDependencies(root, ['dependencies', 'optionalDependencies'])) {
		dependencies.add(name);
	}

	for (const field of fields) {
		const member = findMember(root, field);

		if (!member) {
			continue;
		}

		if (member.value.type !== 'Array') {
			// A `false` value is tolerated by npm as a no-op ("bundle nothing"); `true` and other non-arrays are invalid.
			if (member.value.type === 'Boolean' && member.value.value === false) {
				continue;
			}

			yield {
				node: member.value,
				messageId: TYPE_MESSAGE_ID,
				data: {field},
			};
			continue;
		}

		for (const element of member.value.elements) {
			if (element.value.type !== 'String') {
				yield {
					node: element.value,
					messageId: ELEMENT_MESSAGE_ID,
					data: {field},
				};
			} else if (!dependencies.has(element.value.value)) {
				yield {
					node: element.value,
					messageId: MISSING_MESSAGE_ID,
					data: {name: element.value.value},
				};
			}
		}
	}
}
