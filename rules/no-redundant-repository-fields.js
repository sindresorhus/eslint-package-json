import GitHost from 'hosted-git-info';
import {getRootObject, findMember, removeMember} from './utils/index.js';

const MESSAGE_ID = 'no-redundant-repository-fields';

const messages = {
	[MESSAGE_ID]: 'The `{{field}}` field is redundant; npm already infers this value from `repository` when publishing.',
};

/**
Get the `repository` URL to resolve, or `undefined` when the field is missing, malformed (left to `valid-fields`), or scoped to a subdirectory. A `directory` value legitimately points `bugs`/`homepage` elsewhere, which npm's inference does not account for.
*/
function getRepositoryUrl(root) {
	const repository = findMember(root, 'repository');

	if (!repository) {
		return undefined;
	}

	if (repository.value.type === 'String') {
		return repository.value.value;
	}

	if (repository.value.type !== 'Object' || findMember(repository.value, 'directory')) {
		return undefined;
	}

	const url = findMember(repository.value, 'url');

	return url?.value.type === 'String' ? url.value.value : undefined;
}

/**
Get the URL a `bugs` field resolves to when it is either the shorthand string form or an object form carrying only `url` (an object with `email` too is not fully redundant).
*/
function getBugsUrl(bugsValue) {
	if (bugsValue.type === 'String') {
		return bugsValue.value;
	}

	if (bugsValue.type === 'Object' && bugsValue.members.length === 1) {
		const url = findMember(bugsValue, 'url');
		return url?.value.type === 'String' ? url.value.value : undefined;
	}

	return undefined;
}

/** @param {import('eslint').Rule.RuleContext} context */
const create = context => ({
	Document(node) {
		const root = getRootObject(node);

		if (!root) {
			return;
		}

		const repositoryUrl = getRepositoryUrl(root);

		if (!repositoryUrl) {
			return;
		}

		const hosted = GitHost.fromUrl(repositoryUrl);

		if (!hosted) {
			return;
		}

		const {sourceCode} = context;

		const homepage = findMember(root, 'homepage');
		const inferredHomepage = hosted.docs();

		if (inferredHomepage && homepage?.value.type === 'String' && homepage.value.value === inferredHomepage) {
			context.report({
				node: homepage.name,
				messageId: MESSAGE_ID,
				data: {field: 'homepage'},
				* fix(fixer) {
					yield * removeMember(fixer, sourceCode, homepage);
				},
			});
		}

		const bugs = findMember(root, 'bugs');
		const inferredBugsUrl = hosted.bugs();

		if (inferredBugsUrl && bugs && getBugsUrl(bugs.value) === inferredBugsUrl) {
			context.report({
				node: bugs.name,
				messageId: MESSAGE_ID,
				data: {field: 'bugs'},
				* fix(fixer) {
					yield * removeMember(fixer, sourceCode, bugs);
				},
			});
		}
	},
});

/** @type {import('eslint').Rule.RuleModule} */
const config = {
	create,
	meta: {
		type: 'suggestion',
		docs: {
			description: 'Disallow `bugs`/`homepage` values that duplicate what npm infers from `repository`.',
			recommended: false,
		},
		fixable: 'code',
		schema: [],
		messages,
		languages: ['json/json'],
	},
};

export default config;
