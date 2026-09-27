import {getRootObject, findMember} from './utils/index.js';

const MESSAGE_ID = 'prefer-https-urls';

const messages = {
	[MESSAGE_ID]: 'Use `https://` instead of `http://` for `{{value}}`.',
};

// A URL scheme is case-insensitive (RFC 3986), so `HTTP://` is the same insecure scheme spelled differently.
const httpSchemePattern = /^http:\/\//iu;

// Npm reads the url out of a person string with `person.match(/\(([^()]+)\)/)`, which is the first parenthesised group holding at least one character and no parenthesis of its own. A string with no such group is a name, not a url.
const personUrlPattern = /\(([^()]+)\)/u;

const toHttps = url => 'https://' + url.slice('http://'.length);

/**
The values of a field that holds one value or an array of them.
*/
const getValues = member => member?.value.type === 'Array'
	? member.value.elements.map(element => element.value)
	: [member?.value];

/**
The url node of a value written as a URL string or as an object holding a `url`.
*/
const getUrlNode = node => node?.type === 'Object' ? findMember(node, 'url')?.value : node;

/** @param {import('eslint').Rule.RuleContext} context */
const create = context => {
	const report = (node, url, fixedValue) => {
		context.report({
			node,
			messageId: MESSAGE_ID,
			data: {value: url},
			fix: fixer => fixer.replaceText(node, JSON.stringify(fixedValue)),
		});
	};

	/**
	Report an `http://` string value, fixing it to `https://`.
	*/
	const checkValue = valueNode => {
		if (valueNode?.type !== 'String' || !httpSchemePattern.test(valueNode.value)) {
			return;
		}

		report(valueNode, valueNode.value, toHttps(valueNode.value));
	};

	/**
	Check a person, written as an object with a `url` or `web` or in npm's `"Name <email> (url)"` string form.
	*/
	const checkPerson = valueNode => {
		if (valueNode?.type === 'Object') {
			// Npm reads a person object's url as `url || web`.
			const url = findMember(valueNode, 'url')?.value;
			checkValue(url?.type === 'String' && url.value !== '' ? url : findMember(valueNode, 'web')?.value);
			return;
		}

		if (valueNode?.type !== 'String') {
			return;
		}

		const url = personUrlPattern.exec(valueNode.value)?.[1];

		if (!url || !httpSchemePattern.test(url)) {
			return;
		}

		report(valueNode, url, valueNode.value.replace(personUrlPattern, () => `(${toHttps(url)})`));
	};

	return {
		Document(node) {
			const root = getRootObject(node);

			if (!root) {
				return;
			}

			checkValue(findMember(root, 'homepage')?.value);

			for (const field of ['bugs', 'repository', 'funding']) {
				for (const value of getValues(findMember(root, field))) {
					checkValue(getUrlNode(value));
				}
			}

			// Npm publishes a person's url in registry metadata exactly as written, so an `http://` one ships just as an `http://` homepage does.
			for (const field of ['author', 'contributors', 'maintainers']) {
				for (const value of getValues(findMember(root, field))) {
					checkPerson(value);
				}
			}
		},
	};
};

/** @type {import('eslint').Rule.RuleModule} */
const config = {
	create,
	meta: {
		type: 'suggestion',
		docs: {
			description: 'Prefer `https://` URLs in metadata fields.',
			recommended: true,
		},
		fixable: 'code',
		schema: [],
		messages,
		languages: ['json/json'],
	},
};

export default config;
