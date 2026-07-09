import {findMember} from '../utils/index.js';

const PERSON_TYPE_MESSAGE_ID = 'personType';
const NAME_MESSAGE_ID = 'name';
const CONTRIBUTORS_TYPE_MESSAGE_ID = 'contributorsType';

export const messages = {
	[PERSON_TYPE_MESSAGE_ID]: 'A person must be a string or an object with a `name`.',
	[NAME_MESSAGE_ID]: 'A person object must have a `name` string.',
	[CONTRIBUTORS_TYPE_MESSAGE_ID]: 'The `contributors` field must be an array.',
};

export function * check(root) {
	// A person is the `"Name <email> (url)"` string form or an object with a `name`.
	function * checkPerson(node) {
		if (node.type === 'String') {
			return;
		}

		if (node.type !== 'Object') {
			yield {
				node,
				messageId: PERSON_TYPE_MESSAGE_ID,
			};
			return;
		}

		const name = findMember(node, 'name');

		if (name?.value.type !== 'String') {
			yield {
				node: name?.value ?? node,
				messageId: NAME_MESSAGE_ID,
			};
		}
	}

	const author = findMember(root, 'author');

	if (author) {
		yield * checkPerson(author.value);
	}

	const contributors = findMember(root, 'contributors');

	if (contributors) {
		if (contributors.value.type === 'Array') {
			for (const element of contributors.value.elements) {
				yield * checkPerson(element.value);
			}
		} else {
			yield {
				node: contributors.value,
				messageId: CONTRIBUTORS_TYPE_MESSAGE_ID,
			};
		}
	}
}
