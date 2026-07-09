import {findMember} from '../utils/index.js';

const MESSAGE_ID_MISSING_URL = 'missing-url';
const MESSAGE_ID_TYPE = 'type';
const MESSAGE_ID_INVALID_URL = 'invalid-url';
const MESSAGE_ID_FIELD_TYPE = 'field-type';

export const messages = {
	[MESSAGE_ID_MISSING_URL]: 'The `repository` object must have a string `url`.',
	[MESSAGE_ID_TYPE]: 'The `repository` `{{key}}` must be a string.',
	[MESSAGE_ID_INVALID_URL]: 'The `repository` URL `{{url}}` is not a valid URL or shorthand.',
	[MESSAGE_ID_FIELD_TYPE]: 'The `repository` field must be a URL string or an object.',
};

/**
Whether a `repository` value is a valid URL or a recognized npm shorthand.
*/
function isValidRepositoryUrl(value) {
	// Hosted shorthands (`github:user/repo`), GitHub `user/repo` shorthand, and scp-like SSH (`git@host:path`).
	if (
		/^(?:github|gitlab|bitbucket|gist):/.test(value)
		|| /^[\w\-.]+\/[\w\-.]+$/.test(value)
		|| /^[^/@]+@[^:]+:.+/.test(value)
	) {
		return true;
	}

	try {
		// eslint-disable-next-line no-new
		new URL(value.replace(/^git\+/, ''));
		return true;
	} catch {
		return false;
	}
}

export function * check(root) {
	const member = findMember(root, 'repository');

	if (!member) {
		return;
	}

	// The string shorthand form only needs its URL validated.
	if (member.value.type === 'String') {
		if (!isValidRepositoryUrl(member.value.value)) {
			yield {
				node: member.value,
				messageId: MESSAGE_ID_INVALID_URL,
				data: {url: member.value.value},
			};
		}

		return;
	}

	if (member.value.type !== 'Object') {
		yield {
			node: member.value,
			messageId: MESSAGE_ID_FIELD_TYPE,
		};
		return;
	}

	const object = member.value;
	const urlMember = findMember(object, 'url');

	if (!urlMember) {
		yield {
			node: object,
			messageId: MESSAGE_ID_MISSING_URL,
		};
	} else if (urlMember.value.type !== 'String') {
		yield {
			node: urlMember.value,
			messageId: MESSAGE_ID_TYPE,
			data: {key: 'url'},
		};
	} else if (!isValidRepositoryUrl(urlMember.value.value)) {
		yield {
			node: urlMember.value,
			messageId: MESSAGE_ID_INVALID_URL,
			data: {url: urlMember.value.value},
		};
	}

	for (const key of ['type', 'directory']) {
		const subMember = findMember(object, key);

		if (subMember && subMember.value.type !== 'String') {
			yield {
				node: subMember.value,
				messageId: MESSAGE_ID_TYPE,
				data: {key},
			};
		}
	}
}
