import {findMember} from '../utils/index.js';

const TYPE_MESSAGE_ID = 'type';
const URL_MESSAGE_ID = 'url';
const INVALID_URL_MESSAGE_ID = 'invalidUrl';

export const messages = {
	[TYPE_MESSAGE_ID]: 'The `funding` field must be a URL string, an object with a `url`, or an array of those.',
	[URL_MESSAGE_ID]: 'A `funding` object must have a `url` string.',
	[INVALID_URL_MESSAGE_ID]: 'A `funding` URL must be an `http:` or `https:` URL; `npm fund` drops the whole `funding` field when one entry holds anything else.',
};

// `npm fund` reads a funding entry only when its URL parses and carries an `http:`/`https:` host, so a value that misses that check is a funding link the author believes is there and nobody ever sees.
const isFundableUrl = value => {
	let url;

	try {
		url = new URL(value);
	} catch {
		return false;
	}

	return (url.protocol === 'https:' || url.protocol === 'http:') && url.host !== '';
};

export function * check(root) {
	const checkUrl = (node, url) => (isFundableUrl(url)
		? undefined
		: {
			node,
			messageId: INVALID_URL_MESSAGE_ID,
		});

	const checkObject = objectNode => {
		const url = findMember(objectNode, 'url');

		if (url?.value.type !== 'String') {
			return {
				node: url?.value ?? objectNode,
				messageId: URL_MESSAGE_ID,
			};
		}

		return checkUrl(url.value, url.value.value);
	};

	const funding = findMember(root, 'funding');

	if (!funding) {
		return;
	}

	const {value} = funding;

	switch (value.type) {
		case 'String': {
			const problem = checkUrl(value, value.value);
			if (problem) {
				yield problem;
			}

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
					const problem = checkUrl(element.value, element.value.value);
					if (problem) {
						yield problem;
					}

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
