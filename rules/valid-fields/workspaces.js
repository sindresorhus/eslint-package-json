import {checkStringElements, findMember} from '../utils/index.js';

const TYPE_MESSAGE_ID = 'type';
const PACKAGES_MESSAGE_ID = 'packages';
const ELEMENT_MESSAGE_ID = 'element';

export const messages = {
	[TYPE_MESSAGE_ID]: 'The `workspaces` field must be an array of globs.',
	[PACKAGES_MESSAGE_ID]: 'A `workspaces` object must hold an array of globs in its `packages` field; npm reads nothing else and fails to install without it.',
	[ELEMENT_MESSAGE_ID]: 'Each `workspaces` entry must be a string.',
};

export function * check(root) {
	const workspaces = findMember(root, 'workspaces');

	if (!workspaces) {
		return;
	}

	const {value} = workspaces;

	// Yarn classic's `{packages, nohoist}` object form is accepted, but only because npm reads `packages` out of it. Npm uses that array as the pattern list directly, so anything else fails to install with `EWORKSPACESCONFIG`, including `{nohoist}` on its own and a `packages` that is not an array.
	if (value.type === 'Object') {
		const packages = findMember(value, 'packages');

		if (packages?.value.type !== 'Array') {
			yield {
				node: value,
				messageId: PACKAGES_MESSAGE_ID,
			};
			return;
		}

		yield * checkStringElements(packages.value);

		return;
	}

	if (value.type !== 'Array') {
		yield {
			node: value,
			messageId: TYPE_MESSAGE_ID,
		};
		return;
	}

	yield * checkStringElements(value);
}
