import {findMember, hasInvalidPackageTargetSegment} from '../utils/index.js';

const TYPE_MESSAGE_ID = 'type';
const BROWSER_TYPE_MESSAGE_ID = 'browserType';
const BROWSER_KEY_MESSAGE_ID = 'browserKey';
const BROWSER_VALUE_TYPE_MESSAGE_ID = 'browserValueType';
const BROWSER_VALUE_MESSAGE_ID = 'browserValue';

export const messages = {
	[TYPE_MESSAGE_ID]: 'The `{{field}}` field must be a string.',
	[BROWSER_TYPE_MESSAGE_ID]: 'The `browser` field must be a string or an object.',
	[BROWSER_KEY_MESSAGE_ID]: 'The `browser` mapping key `{{key}}` is not a valid path.',
	[BROWSER_VALUE_TYPE_MESSAGE_ID]: 'The `browser` mapping for `{{key}}` must be a string or `false`.',
	[BROWSER_VALUE_MESSAGE_ID]: 'The `browser` mapping value `{{value}}` is not a valid path or package specifier.',
};

const entryPointFields = ['main', 'module', 'types', 'typings'];

function isInvalidBrowserPath(value) {
	return value.startsWith('/')
		|| value.startsWith('../')
		|| value.split('/').includes('..')
		|| value.includes('://')
		|| (value.startsWith('./') && hasInvalidPackageTargetSegment(value));
}

function * checkBrowserValue(node, key) {
	if (node.type === 'Boolean' && node.value === false) {
		return;
	}

	if (node.type !== 'String') {
		yield {
			node,
			messageId: BROWSER_VALUE_TYPE_MESSAGE_ID,
			data: {key},
		};
		return;
	}

	if (isInvalidBrowserPath(node.value)) {
		yield {
			node,
			messageId: BROWSER_VALUE_MESSAGE_ID,
			data: {value: node.value},
		};
	}
}

export function * check(root) {
	for (const field of entryPointFields) {
		const member = findMember(root, field);

		if (member && member.value.type !== 'String') {
			yield {
				node: member.value,
				messageId: TYPE_MESSAGE_ID,
				data: {field},
			};
		}
	}

	const browser = findMember(root, 'browser');

	if (!browser) {
		return;
	}

	if (browser.value.type === 'String') {
		if (isInvalidBrowserPath(browser.value.value)) {
			yield {
				node: browser.value,
				messageId: BROWSER_VALUE_MESSAGE_ID,
				data: {value: browser.value.value},
			};
		}

		return;
	}

	if (browser.value.type !== 'Object') {
		yield {
			node: browser.value,
			messageId: BROWSER_TYPE_MESSAGE_ID,
		};
		return;
	}

	for (const member of browser.value.members) {
		if (isInvalidBrowserPath(member.name.value)) {
			yield {
				node: member.name,
				messageId: BROWSER_KEY_MESSAGE_ID,
				data: {key: member.name.value},
			};
		}

		for (const problem of checkBrowserValue(member.value, member.name.value)) {
			yield problem;
		}
	}
}
