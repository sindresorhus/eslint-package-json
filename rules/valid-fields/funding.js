import {findMember} from '../utils/index.js';

const TYPE_MESSAGE_ID = 'type';
const URL_MESSAGE_ID = 'url';

export const messages = {
	[TYPE_MESSAGE_ID]: 'The `funding` field must be a URL string, an object with a `url`, or an array of those.',
	[URL_MESSAGE_ID]: 'A `funding` object must have a `url` string.',
};

export function * check(root) {
	const checkObject = objectNode => {
		const url = findMember(objectNode, 'url');

		if (url?.value.type !== 'String') {
			return {
				node: url?.value ?? objectNode,
				messageId: URL_MESSAGE_ID,
			};
		}
	};

	const funding = findMember(root, 'funding');

	if (!funding) {
		return;
	}

	const {value} = funding;

	switch (value.type) {
		case 'String': {
			break;
		}

		case 'Object': {
			const problem = checkObject(value);
			if (problem) {
				yield problem;
			}

			break;
		}

		case 'Array': {
			for (const element of value.elements) {
				if (element.value.type === 'String') {
					continue;
				}

				if (element.value.type === 'Object') {
					const problem = checkObject(element.value);
					if (problem) {
						yield problem;
					}

					continue;
				}

				yield {
					node: element.value,
					messageId: TYPE_MESSAGE_ID,
				};
			}

			break;
		}

		default: {
			yield {
				node: value,
				messageId: TYPE_MESSAGE_ID,
			};
		}
	}
}
