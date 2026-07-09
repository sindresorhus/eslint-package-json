import {getRootObject, findMember, getKey} from './utils/index.js';

const MESSAGE_ID = 'prefer-shorthand';

const messages = {
	[MESSAGE_ID]: 'The `{{field}}` field can use the shorthand string form.',
};

/**
Get an object member's value when it is a string, otherwise `undefined`.
*/
const getStringValue = (objectNode, key) => {
	const member = findMember(objectNode, key);

	return member?.value.type === 'String' ? member.value.value : undefined;
};

const personFields = new Set(['name', 'email', 'url']);

/**
Build the `"Name <email> (url)"` people form from an object, or `undefined` if it has no string `name` or carries fields the string form cannot represent.
*/
const personToShorthand = objectNode => {
	// The string form only carries name, email, and url; any other field would be silently dropped.
	if (objectNode.members.some(member => !personFields.has(getKey(member)))) {
		return undefined;
	}

	const name = getStringValue(objectNode, 'name');

	if (!name) {
		return undefined;
	}

	const email = getStringValue(objectNode, 'email');
	const url = getStringValue(objectNode, 'url');

	return name + (email ? ` <${email}>` : '') + (url ? ` (${url})` : '');
};

const repositoryFields = new Set(['type', 'url']);

// `github.com` must be at the host position — right after `//` (optionally with userinfo) or `@` (SCP/SSH form) — so a path segment like `https://example.com/github.com/...` is not mistaken for a GitHub URL.
const githubPattern = /(?:\/\/|@)github\.com[/:]([^/]+)\/([^/]+)/;

/**
Build the `github:user/repo` shorthand from a repository object, or `undefined` when not a github URL.
*/
const repositoryToShorthand = objectNode => {
	// The shorthand carries only the URL, so any other field (`directory` for a monorepo subpath, a
	// non-git `type`, etc.) would be silently dropped.
	if (objectNode.members.some(member => !repositoryFields.has(getKey(member)))) {
		return undefined;
	}

	const type = getStringValue(objectNode, 'type');

	if (type !== undefined && type !== 'git') {
		return undefined;
	}

	const url = getStringValue(objectNode, 'url');

	if (url === undefined) {
		return undefined;
	}

	// A URL with a commit-ish fragment (`#tag`) or query cannot round-trip through the bare shorthand, so leave the object form as-is.
	if (/[#?]/.test(url)) {
		return undefined;
	}

	const match = githubPattern.exec(url);

	if (!match) {
		return undefined;
	}

	const repository = match[2].replace(/\.git$/, '');

	return `github:${match[1]}/${repository}`;
};

/**
Collect every field whose value can be replaced with a shorthand string.
*/
const collectShorthands = root => {
	const results = [];

	// The string shorthand carries only the URL, so it is equivalent only when `url` is the sole field; an object with `email`, `type`, or any other field would lose data.
	for (const field of ['bugs', 'funding']) {
		const member = findMember(root, field);

		if (member?.value.type === 'Object' && member.value.members.length === 1) {
			const url = getStringValue(member.value, 'url');

			if (url !== undefined) {
				results.push({node: member.value, field, shorthand: url});
			}
		}
	}

	const author = findMember(root, 'author');

	if (author?.value.type === 'Object') {
		const shorthand = personToShorthand(author.value);

		if (shorthand !== undefined) {
			results.push({node: author.value, field: 'author', shorthand});
		}
	}

	const contributors = findMember(root, 'contributors');

	if (contributors?.value.type === 'Array') {
		for (const element of contributors.value.elements) {
			if (element.value.type !== 'Object') {
				continue;
			}

			const shorthand = personToShorthand(element.value);

			if (shorthand !== undefined) {
				results.push({node: element.value, field: 'contributors', shorthand});
			}
		}
	}

	const repository = findMember(root, 'repository');

	if (repository?.value.type === 'Object') {
		const shorthand = repositoryToShorthand(repository.value);

		if (shorthand !== undefined) {
			results.push({node: repository.value, field: 'repository', shorthand});
		}
	}

	return results;
};

/** @param {import('eslint').Rule.RuleContext} context */
const create = context => ({
	Document(node) {
		const root = getRootObject(node);

		if (!root) {
			return;
		}

		for (const {node: valueNode, field, shorthand} of collectShorthands(root)) {
			context.report({
				node: valueNode,
				messageId: MESSAGE_ID,
				data: {field},
				fix: fixer => fixer.replaceText(valueNode, JSON.stringify(shorthand)),
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
			description: 'Prefer the shorthand string form of fields where possible.',
			recommended: true,
		},
		fixable: 'code',
		schema: [],
		messages,
		languages: ['json/json'],
	},
};

export default config;
