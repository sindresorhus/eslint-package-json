import npa from 'npm-package-arg';
import {
	findMember,
	getKey,
	isFalsyValue,
	iterateEffectiveMembers,
} from '../utils/index.js';

const TYPE_MESSAGE_ID = 'type';
const VALUE_MESSAGE_ID = 'value';
const SELF_VALUE_MESSAGE_ID = 'selfValue';
const KEY_MESSAGE_ID = 'key';

export const messages = {
	[TYPE_MESSAGE_ID]: 'The `overrides` field must be an object.',
	[VALUE_MESSAGE_ID]: 'The `{{name}}` override must be a version string or a nested overrides object.',
	// `.` is the version slot for the package the enclosing entry names, not a nested scope to descend into, so npm reads its value as a string and calls `startsWith` on it.
	[SELF_VALUE_MESSAGE_ID]: 'The `{{name}}` override\'s `.` entry holds the version for the package itself, so it must be one; npm reads any other value as a version and fails the install.',
	// Every key but `.` names a package, and npm reads each one through `npm-package-arg` before it installs anything, so a key it cannot read stops the install outright.
	[KEY_MESSAGE_ID]: 'The `overrides` key `{{key}}` must name a package, or `npm install` fails to read it.',
};

/**
Read an override key as the package name `OverrideSet` reads, or `undefined` when npm cannot.
*/
const readOverrideName = key => {
	try {
		return npa(key).name || undefined;
	} catch {
		return undefined;
	}
};

/**
Recursively check each override entry: a leaf must be a version string, otherwise it is a nested overrides object.

`packageName` is the entry that owns this object, which is what a `.` member holds the version for. The top-level `overrides` object is owned by nothing, so a `.` there is not read at all.
*/
function * checkOverrides(objectNode, packageName) {
	// Effective members, since a shadowed duplicate is not an override npm ever applies.
	for (const member of iterateEffectiveMembers(objectNode)) {
		const {value} = member;

		if (getKey(member) === '.') {
			// Npm reads `overrides['.'] || keySpec`, so a falsy value is never looked at and a truthy non-string is what it goes on to call `startsWith` on.
			if (packageName !== undefined && value.type !== 'String' && !isFalsyValue(value)) {
				yield {
					node: value,
					messageId: SELF_VALUE_MESSAGE_ID,
					data: {name: packageName},
				};
			}

			continue;
		}

		if (!readOverrideName(getKey(member))) {
			yield {
				node: member.name,
				messageId: KEY_MESSAGE_ID,
				data: {key: getKey(member)},
			};
			continue;
		}

		if (value.type === 'Object') {
			yield * checkOverrides(value, getKey(member));
		} else if (value.type !== 'String') {
			yield {
				node: value,
				messageId: VALUE_MESSAGE_ID,
				data: {name: getKey(member)},
			};
		}
	}
}

export function * check(root) {
	const overrides = findMember(root, 'overrides');

	if (!overrides) {
		return;
	}

	if (overrides.value.type !== 'Object') {
		yield {
			node: overrides.value,
			messageId: TYPE_MESSAGE_ID,
		};
		return;
	}

	for (const problem of checkOverrides(overrides.value, undefined)) {
		yield problem;
	}
}
