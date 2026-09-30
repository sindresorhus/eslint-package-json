import {findMember, isHttpUrl} from '../utils/index.js';

// A URL scheme is `ALPHA *( ALPHA / DIGIT / "+" / "-" / "." )` and is case-insensitive (RFC 3986 §3.1), so `FTP://` and `git+ssh://` both name a scheme npm parses as it stands.
const schemePattern = /^[a-z][\d+\-.a-z]*:/iu;

const MESSAGE_ID = 'valid-homepage';
const SCHEMELESS_MESSAGE_ID = 'schemeless';
const ADD_SCHEME_SUGGESTION_ID = 'addScheme';

export const messages = {
	[MESSAGE_ID]: 'The `homepage` field must be a valid `http(s)` URL.',
	[SCHEMELESS_MESSAGE_ID]: 'The `homepage` field has no scheme, so npm publishes it as `http://{{value}}`.',
	[ADD_SCHEME_SUGGESTION_ID]: 'Write the scheme the page is served with.',
};

export function * check(root) {
	const homepage = findMember(root, 'homepage');

	if (!homepage) {
		return;
	}

	const {value} = homepage;

	if (value.type !== 'String') {
		yield {
			node: value,
			messageId: MESSAGE_ID,
		};
		return;
	}

	if (isHttpUrl(value.value)) {
		return;
	}

	// A path like `.` or `/myapp` is Create React App's setting for where the app is served from, not a URL anyone meant to publish, so it is left alone. Npm would publish it as `http:///myapp`, and no scheme the rule could add makes it a working URL.
	if (value.value.startsWith('.') || (value.value.startsWith('/') && !value.value.startsWith('//'))) {
		return;
	}

	// Npm prefixes a scheme it cannot parse with `http://`, which is a working URL for a bare host and nonsense for anything else, so a value with no scheme at all is told apart from one that merely is not `http(s)`. A protocol-relative `//host` has no scheme either but is nonsense after the prefix, which makes `http:////host`.
	const isSchemeless = !schemePattern.test(value.value) && !value.value.startsWith('//');

	if (isSchemeless && URL.canParse(`http://${value.value}`)) {
		yield {
			node: value,
			messageId: SCHEMELESS_MESSAGE_ID,
			data: {value: value.value},
			suggest: [
				{
					messageId: ADD_SCHEME_SUGGESTION_ID,
					fix: fixer => fixer.replaceText(value, JSON.stringify(`https://${value.value}`)),
				},
			],
		};
		return;
	}

	yield {
		node: value,
		messageId: MESSAGE_ID,
	};
}
