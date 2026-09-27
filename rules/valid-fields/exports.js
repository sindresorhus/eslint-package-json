import {
	findMember,
	getKey,
	checkKeyConsistency,
	keyConsistencyMessages,
	hasInvalidPackageTargetSegment,
	isArrayIndexKey,
	iterateStringValues,
	withoutShadowedMembers,
} from '../utils/index.js';

const MESSAGE_ID_RELATIVE_PATH = 'relativePath';
const MESSAGE_ID_SUBPATH_KEY = 'subpathKey';
const MESSAGE_ID_CONDITION_KEY = 'conditionKey';
const MESSAGE_ID_PATTERN = 'patternMismatch';
const MESSAGE_ID_TARGET_TYPE = 'targetType';
const MESSAGE_ID_INVALID_TARGET = 'invalidTarget';
const MESSAGE_ID_ROOT_TYPE = 'rootType';
const SUGGESTION_ID_RELATIVE_PATH = 'makeRelative';

export const messages = {
	...keyConsistencyMessages,
	[MESSAGE_ID_RELATIVE_PATH]: 'Export target `{{value}}` must be a package-relative path starting with `./`.',
	[MESSAGE_ID_SUBPATH_KEY]: 'Subpath key `{{key}}` must be `.` or start with `./`.',
	[MESSAGE_ID_CONDITION_KEY]: 'Condition key `{{key}}` must not be an array index.',
	[MESSAGE_ID_INVALID_TARGET]: 'Export target `{{value}}` contains a path segment that Node does not allow.',
	[MESSAGE_ID_PATTERN]: 'The target `{{value}}` must not contain `*` unless the subpath key `{{key}}` also contains `*`.',
	[MESSAGE_ID_TARGET_TYPE]: 'An `exports` target must be a string, `null`, an object, or an array.',
	[MESSAGE_ID_ROOT_TYPE]: 'The top-level `exports` field must be a string, an object, or an array.',
	[SUGGESTION_ID_RELATIVE_PATH]: 'Change the target to `{{fixedValue}}`.',
};

function * checkPatternTarget(node, key) {
	if (key.includes('*')) {
		return;
	}

	for (const leaf of iterateStringValues(node)) {
		if (leaf.value.includes('*')) {
			yield {
				node: leaf,
				messageId: MESSAGE_ID_PATTERN,
				data: {key, value: leaf.value},
			};
		}
	}
}

/**
Recursively check all object nodes within the exports tree, yielding problems.
*/
function * checkExportsNode(node) {
	switch (node.type) {
		case 'Object': {
			yield * checkObject(node);

			break;
		}

		case 'Array': {
			for (const element of node.elements) {
				yield * checkExportsNode(element.value);
			}

			break;
		}

		case 'String': {
			const {value} = node;

			if (value.startsWith('./')) {
				if (hasInvalidPackageTargetSegment(value)) {
					yield {
						node,
						messageId: MESSAGE_ID_INVALID_TARGET,
						data: {value},
					};
				}

				break;
			}

			const problem = {
				node,
				messageId: MESSAGE_ID_RELATIVE_PATH,
				data: {value},
			};
			// The leading slashes are dropped rather than carried across, so a leading `/` becomes `./` and the
			// result names the same file without the double slash Node only warns about (DEP0166).
			const fixedValue = './' + value.replace(/^\/+/u, '');

			// Only offer the prefix when it produces a valid package target. It is a suggestion, not an autofix, because it changes what the target resolves to: a leading `/` may be a real absolute path on the author's machine, and a bare target may have meant a package.
			if (value !== '' && !URL.canParse(value) && !hasInvalidPackageTargetSegment(fixedValue)) {
				problem.suggest = [
					{
						messageId: SUGGESTION_ID_RELATIVE_PATH,
						data: {fixedValue},
						fix: fixer => fixer.replaceText(node, JSON.stringify(fixedValue)),
					},
				];
			}

			yield problem;

			break;
		}

		case 'Null': {
			break;
		}

		default: {
			yield {
				node,
				messageId: MESSAGE_ID_TARGET_TYPE,
			};
		}
	}
}

/**
Check a single object node for subpath/condition key validity, then recurse into member values.
*/
function * checkObject(objectNode) {
	for (const member of objectNode.members) {
		const key = getKey(member);

		if (isArrayIndexKey(key)) {
			yield {
				node: member.name,
				messageId: MESSAGE_ID_CONDITION_KEY,
				data: {key},
			};
		}

		// A subpath key (one that starts with `.`) must be exactly `.` or start with `./`.
		if (key.startsWith('.') && key !== '.' && !key.startsWith('./')) {
			yield {
				node: member.name,
				messageId: MESSAGE_ID_SUBPATH_KEY,
				data: {key},
			};
		}

		// A target pattern only has meaning when the subpath key is also a pattern.
		if (key.startsWith('.')) {
			yield * checkPatternTarget(member.value, key);
		}

		yield * checkExportsNode(member.value);
	}
}

function isTopLevelConditionMap(node) {
	return node.type === 'Object' && node.members.every(member => !getKey(member).startsWith('.'));
}

export function * check(root) {
	const exportsMember = findMember(root, 'exports');

	if (!exportsMember) {
		return;
	}

	// Collapsed the way `JSON.parse` builds the tree, so a shadowed duplicate is not checked as a target npm
	// never resolves. The surviving members are the original nodes, so reports still point at real ranges.
	const value = withoutShadowedMembers(exportsMember.value);

	if (!['String', 'Object', 'Array'].includes(value.type)) {
		yield {
			node: value,
			messageId: MESSAGE_ID_ROOT_TYPE,
		};
		return;
	}

	// Node raises "cannot contain some keys starting with '.' and some not" from
	// `isConditionalExportsMainSugar`, which it runs once, on the top-level object. A nested object is walked
	// for `default` or a matching condition, so a key starting with `.` beside one that does not is a
	// condition no consumer asks for, and the target beside it still resolves.
	if (value.type === 'Object') {
		yield * checkKeyConsistency(value, '.');
	}

	const reports = [
		...(value.type !== 'Object' || isTopLevelConditionMap(value) ? checkPatternTarget(value, '.') : []),
		...checkExportsNode(value),
	];

	// A top-level condition map has no subpath key of its own, so `checkPatternTarget` stands in for one and
	// reports every target under it. A subpath key nested inside that map is then checked against its own key,
	// which repeats the report for any target the two agree about. The same target under two different subpath
	// keys is a real difference, so the key the message names is part of what makes a report its own. That
	// leaves one target the map has no subpath key for reported twice under the synthetic `.` and its own key,
	// which is a small price for not having to know which shape the map is.
	const reported = new Set();

	for (const report of reports) {
		const key = `${report.messageId}:${report.node.range[0]}:${report.data?.key ?? ''}`;

		if (reported.has(key)) {
			continue;
		}

		reported.add(key);
		yield report;
	}
}
