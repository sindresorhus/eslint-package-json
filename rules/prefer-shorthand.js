import {
	getRootObject,
	findMember,
	getKey,
	countEffectiveMembers,
	isEmail,
} from './utils/index.js';

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

// The string form delimits the email with `<>` and the url with `()`, so a value containing any of those characters is re-parsed into a different field. For example `{"name": "Foo (Bar)", "email": "x@y.z"}` would become `"Foo (Bar) <x@y.z>"`, which npm reads back as the name `Foo` with the url `Bar`.
const personDelimiterPattern = /[()<>]/u;

/**
Build the `"Name <email> (url)"` people form from an object, or `undefined` if it has no string `name`, carries fields the string form cannot represent, or holds a value that would not survive the round trip.
*/
const personToShorthand = objectNode => {
	// The string form only carries name, email, and url; any other field, or one of those carrying a non-string value, would be silently dropped. Nothing else in the plugin reports a non-string `email` or `url`, so dropping it here would be the only signal the author gets.
	if (objectNode.members.some(member => !personFields.has(getKey(member)) || member.value.type !== 'String')) {
		return undefined;
	}

	const name = getStringValue(objectNode, 'name');

	if (!name) {
		return undefined;
	}

	const email = getStringValue(objectNode, 'email');
	const url = getStringValue(objectNode, 'url');

	if ([name, email, url].some(value => value !== undefined && personDelimiterPattern.test(value))) {
		return undefined;
	}

	return name + (email ? ` <${email}>` : '') + (url ? ` (${url})` : '');
};

const repositoryFields = new Set(['type', 'url']);

// `github.com` must be the host, and the pattern is anchored at the start so a path segment on another host is never mistaken for one: `https://gitlab.com/@github.com/u/r` and `https://example.com/@github.com/user/repo` both contain the host as a path segment, and matching either would repoint the package at a different repository. The host may carry a scheme, and userinfo after the scheme, and the SCP form `git@github.com:user/repo` carries neither. The path must also end at the repository name, because anything past it names a ref, a file, or the issue tracker, and the bare shorthand carries none of that. A single trailing `.git` is the one thing npm strips from the URL itself, so it is matched here rather than cut off afterwards; an inner `repo.git.git` keeps its first `.git`.
const githubPattern = /^(?:[a-z][\w+\-.]*:\/\/)?(?:[^/]*@)?github\.com[/:]([^/]+)\/([^/]+?)(?:\.(git))?\/?$/iu;

// `github:user/repo` always publishes as a `git+https` remote, so the object form resolves to the same repository afterwards only when it is a credential-free `https` URL. An `ssh` or SCP URL would switch transport, and userinfo would be deleted from the published URL.
const httpsRemotePattern = /^(?:git\+)?https:\/\/(?![^/@]*@)[^/]+\//iu;

/**
Build the `github:user/repo` shorthand from a repository object, or `undefined` when not a github URL.
*/
const repositoryToShorthand = objectNode => {
	// The shorthand carries only the URL, so any other field (`directory` for a monorepo subpath, a non-git `type`, etc.) would be silently dropped.
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

	if (!httpsRemotePattern.test(url)) {
		return undefined;
	}

	const match = githubPattern.exec(url);

	if (!match) {
		return undefined;
	}

	// Npm strips exactly one trailing `.git` and nothing else, so `github:u/repo.git` names the repository `repo` while `repo.GIT` keeps that spelling and the shorthand has to carry it. A name that is itself `repo.git` is the one shape with no shorthand that round-trips, because npm strips the last `.git` off the name the shorthand carries as well, and both then name `repo`.
	const [, user, name, suffix] = match;

	if (name.endsWith('.git')) {
		return undefined;
	}

	// The pattern matches the suffix whatever its case and captures the spelling it matched, so the lowercase one is the only one npm strips and any other has to be written back out.
	const keptSuffix = suffix === undefined || suffix === 'git' ? '' : `.${suffix}`;

	return `github:${user}/${name}${keptSuffix}`;
};

/**
Collect every field whose value can be replaced with a shorthand string.
*/
const collectShorthands = root => {
	const results = [];

	// The string shorthand carries only the URL, so it is equivalent only when `url` is the sole field; an object with `email`, `type`, or any other field would lose data. A key repeated with a different value is still one field, so the count is of effective members.
	for (const field of ['bugs', 'funding']) {
		const member = findMember(root, field);

		if (member?.value.type === 'Object' && countEffectiveMembers(member.value) === 1) {
			const url = getStringValue(member.value, 'url');

			// An empty `url` would become an empty field that `no-empty-fields` then reports.
			// Npm re-reads a `bugs` string that holds an `@` before a later `.` as `bugs.email`, so the shorthand would flip the key's meaning.
			if (url && !(field === 'bugs' && isEmail(url))) {
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
