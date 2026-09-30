import {getRootObject, findMember, getKey} from './utils/index.js';

const MESSAGE_ID = 'no-exports-trailing-slash';
const MESSAGE_ID_PATTERN = 'pattern';
const MESSAGE_ID_COLLISION = 'collision';
const MESSAGE_ID_FOLDER_TARGET = 'folderTarget';
const SUGGESTION_ID = 'convert';

const messages = {
	// A `*` in the target is the substitution point, so a key without one leaves it literal and it names a file npm packs no path for. Both halves need the pattern, which is what the shape with a folder-mapping key gets from the suggestion and this one has to be told.
	[MESSAGE_ID]: 'Trailing-slash folder mapping `{{value}}` in `{{field}}` no longer resolves in Node.js; a subpath pattern needs `*` in the target and in the key beside it.',
	[MESSAGE_ID_PATTERN]: 'Trailing-slash mapping `{{value}}` in `{{field}}` no longer resolves in Node.js; use a subpath pattern without a trailing slash.',
	[MESSAGE_ID_COLLISION]: 'Trailing-slash folder mapping `{{value}}` in `{{field}}` no longer resolves in Node.js, and `{{suggestion}}` is taken, so the two have to be merged.',
	[MESSAGE_ID_FOLDER_TARGET]: 'Target `{{value}}` in `{{field}}` names a folder, which Node.js does not load; point it at a file.',
	[SUGGESTION_ID]: 'Convert to the subpath pattern `"{{key}}": "{{target}}"`.',
};

/**
Whether a subpath key and the target beside it can become a pattern together, which takes both to be a folder mapping: a key or a target that is already a pattern is left alone.
*/
function isFolderMapping(key, value, subpathPrefix) {
	return key.startsWith(subpathPrefix)
		&& key.endsWith('/')
		&& !key.includes('*')
		&& value.type === 'String'
		&& value.value.endsWith('/')
		&& !value.value.includes('*');
}

/**
Recursively walk an `exports`/`imports` value tree, yielding every trailing-slash subpath key and string value.

A key report carries the `folderTarget` beside it when the two can become a pattern together, and a value is only ever converted through the key beside it: a target on its own cannot become a pattern, since the `*` it would carry is the one the key is supposed to substitute. Only a top-level key is a subpath key; Node.js reads a key inside a conditions object as a condition name, so a pattern there would not resolve either.
*/
function * findTrailingSlashes(node, subpathPrefix, {isSubpathLevel, isUnderPattern, isUnderFolderKey}) {
	switch (node.type) {
		case 'Object': {
			const siblingKeys = node.members.map(member => getKey(member));
			// A key another sibling holds too is rewritten twice onto the same new key, which leaves a duplicate member just as much as one that is already there, so it collides in the same way.
			const repeatedKeys = new Set(siblingKeys.filter((sibling, index) => siblingKeys.indexOf(sibling) !== index));

			for (const member of node.members) {
				const memberKey = getKey(member);
				const isPattern = isUnderPattern || memberKey.includes('*');
				const isFolderKey = memberKey.startsWith(subpathPrefix) && memberKey.endsWith('/');

				if (isFolderKey) {
					const isKeyTaken = siblingKeys.includes(memberKey + '*');

					// Rewriting the key onto one that already exists would leave a duplicate member, and `JSON.parse` keeps the last one, so the subpath would resolve to a different target than the author wrote. A sibling holding this same key is rewritten onto it as well, which leaves the same duplicate. Either way this needs a decision about the two patterns rather than a suggestion.
					const canConvert = isSubpathLevel
						&& !isKeyTaken
						&& !repeatedKeys.has(memberKey)
						&& isFolderMapping(memberKey, member.value, subpathPrefix);

					yield {
						node: member.name,
						isPattern,
						isKeyTaken,
						folderTarget: canConvert ? member.value : undefined,
					};
				}

				yield * findTrailingSlashes(member.value, subpathPrefix, {isSubpathLevel: false, isUnderPattern: isPattern, isUnderFolderKey: isUnderFolderKey || isFolderKey});
			}

			break;
		}

		case 'Array': {
			for (const element of node.elements) {
				yield * findTrailingSlashes(element.value, subpathPrefix, {isSubpathLevel: false, isUnderPattern, isUnderFolderKey});
			}

			break;
		}

		case 'String': {
			// A target that is not a relative path, such as `lodash/` or `../x/`, is not a folder in this package, and `valid-fields` already reports it.
			if (node.value.startsWith('./') && node.value.endsWith('/')) {
				// Without a trailing-slash key beside it, the target is no folder mapping but a single export that names a folder.
				yield {node, isPattern: isUnderPattern || node.value.includes('*'), isFolderTarget: !isUnderFolderKey};
			}

			break;
		}
	// No default
	}
}

/** @param {import('eslint').Rule.RuleContext} context */
const create = context => ({
	Document(node) {
		const root = getRootObject(node);

		if (!root) {
			return;
		}

		for (const [field, subpathPrefix] of [['exports', '.'], ['imports', '#']]) {
			const member = findMember(root, field);

			if (!member) {
				continue;
			}

			for (const {node: targetNode, isPattern, isKeyTaken, isFolderTarget, folderTarget} of findTrailingSlashes(member.value, subpathPrefix, {isSubpathLevel: true})) {
				const {value} = targetNode;
				const suggestion = value + '*';
				// A repeated key leaves no pattern for the rewritten one to be taken by, so the message stays the plain one; only a key that is genuinely occupied gets the collision wording.
				let messageId = MESSAGE_ID;

				if (isPattern) {
					messageId = MESSAGE_ID_PATTERN;
				} else if (isFolderTarget) {
					messageId = MESSAGE_ID_FOLDER_TARGET;
				} else if (isKeyTaken) {
					messageId = MESSAGE_ID_COLLISION;
				}

				const report = {
					node: targetNode,
					messageId,
					data: {field, value, suggestion},
				};

				// A suggestion, not a fix: the pattern makes subpaths resolve that threw before, and it takes them from a broader sibling pattern like `./*` that answered them while the folder mapping was ignored.
				if (folderTarget) {
					const target = folderTarget.value + '*';

					report.suggest = [
						{
							messageId: SUGGESTION_ID,
							data: {key: suggestion, target},
							fix: fixer => [
								fixer.replaceText(targetNode, JSON.stringify(suggestion)),
								fixer.replaceText(folderTarget, JSON.stringify(target)),
							],
						},
					];
				}

				context.report(report);
			}
		}
	},
});

/** @type {import('eslint').Rule.RuleModule} */
const config = {
	create,
	meta: {
		type: 'problem',
		docs: {
			description: 'Disallow trailing-slash folder mappings in `exports`/`imports`.',
			recommended: true,
		},
		hasSuggestions: true,
		schema: [],
		messages,
		languages: ['json/json'],
	},
};

export default config;
