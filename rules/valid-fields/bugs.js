import {
	findMember,
	getKey,
	isFalsyValue,
} from '../utils/index.js';

const TYPE_MESSAGE_ID = 'type';
const PROPERTY_MESSAGE_ID = 'property';
const FORMAT_MESSAGE_ID = 'format';
const NOTHING_KEPT_MESSAGE_ID = 'nothingKept';
const STRING_FORMAT_MESSAGE_ID = 'stringFormat';

export const messages = {
	[TYPE_MESSAGE_ID]: 'The `bugs` field must be a URL string or an object with `url`/`email`.',
	[PROPERTY_MESSAGE_ID]: 'The `bugs` `{{property}}` must be a string.',
	[FORMAT_MESSAGE_ID]: 'The `bugs` `{{property}}` must be {{expected}}; npm deletes one that is not, and then the whole `bugs` field once it is empty.',
	[NOTHING_KEPT_MESSAGE_ID]: 'A `bugs` object npm keeps no `url` or `email` from is deleted whole, every key in it with it.',
	[STRING_FORMAT_MESSAGE_ID]: 'A `bugs` string must be a URL or an email address; npm deletes a `bugs` string that is neither.',
};

// Npm's own tests for the shapes a `bugs` value may take, copied so the rule accepts exactly what npm
// keeps and reports exactly what npm throws away. Npm deletes the offending property, then the whole
// `bugs` object once it is empty, without telling the author.
const isEmail = value => value.includes('@') && value.indexOf('@') < value.lastIndexOf('.');
const isUrlOrEmail = value => isEmail(value) || URL.canParse(value);

export function * check(root) {
	const bugs = findMember(root, 'bugs');

	if (!bugs) {
		return;
	}

	const {value} = bugs;

	if (value.type === 'String') {
		if (!isUrlOrEmail(value.value)) {
			yield {
				node: value,
				messageId: STRING_FORMAT_MESSAGE_ID,
			};
		}

		return;
	}

	if (value.type !== 'Object') {
		yield {
			node: value,
			messageId: TYPE_MESSAGE_ID,
		};
		return;
	}

	// Npm checks each property against its own shape and deletes the ones that fail, so a `url` holding an email
	// address goes just as surely as an `email` holding a URL. Either deletion empties the object, and then npm
	// deletes the whole `bugs` field.
	//
	// Npm also copies an old `web` or `name` spelling over `url`. Manifests do not use them in practice, so that is not modelled, and an object that holds its URL only there is reported as keeping nothing.
	//
	// Npm guards each property with the truthiness of its value, so a falsy one is never examined at all: an
	// empty `url` is not a bad url, it is a url npm steps over.
	const urlMember = findMember(value, 'url');
	const emailMember = findMember(value, 'email');
	const truthyMember = member => (member === undefined || isFalsyValue(member.value) ? undefined : member);

	for (const [member, isValid, expected] of [
		[truthyMember(urlMember), value => URL.canParse(value), 'a URL string'],
		[truthyMember(emailMember), isEmail, 'an email address'],
	]) {
		if (!member) {
			continue;
		}

		if (member.value.type !== 'String') {
			yield {
				node: member.value,
				messageId: PROPERTY_MESSAGE_ID,
				data: {property: getKey(member)},
			};
		} else if (!isValid(member.value.value)) {
			yield {
				node: member.value,
				messageId: FORMAT_MESSAGE_ID,
				data: {property: getKey(member), expected},
			};
		}
	}

	// Npm rebuilds the object from the `url` and `email` it kept, and deletes what is left once neither of them is truthy. A key npm ignores entirely is not a problem of its own, but it is all a manifest can have left at that point.
	if (!truthyMember(urlMember) && !truthyMember(emailMember)) {
		yield {
			node: value,
			messageId: NOTHING_KEPT_MESSAGE_ID,
		};
	}
}
