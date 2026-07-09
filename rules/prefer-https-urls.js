import {getRootObject, findMember} from './utils/index.js';

const MESSAGE_ID = 'prefer-https-urls';

const messages = {
	[MESSAGE_ID]: 'Use `https://` instead of `http://` for `{{value}}`.',
};

/** @param {import('eslint').Rule.RuleContext} context */
const create = context => {
	/**
	Report an `http://` string value, fixing it to `https://`.
	*/
	const checkValue = valueNode => {
		if (valueNode?.type !== 'String' || !valueNode.value.startsWith('http://')) {
			return;
		}

		context.report({
			node: valueNode,
			messageId: MESSAGE_ID,
			data: {value: valueNode.value},
			fix: fixer => fixer.replaceText(valueNode, JSON.stringify('https://' + valueNode.value.slice('http://'.length))),
		});
	};

	/**
	Check a field whose value is a URL string or an object with a `url` string.
	*/
	const checkUrlField = member => {
		if (!member) {
			return;
		}

		if (member.value.type === 'String') {
			checkValue(member.value);
		} else if (member.value.type === 'Object') {
			checkValue(findMember(member.value, 'url')?.value);
		}
	};

	return {
		Document(node) {
			const root = getRootObject(node);

			if (!root) {
				return;
			}

			checkValue(findMember(root, 'homepage')?.value);

			for (const field of ['bugs', 'repository']) {
				checkUrlField(findMember(root, field));
			}

			const funding = findMember(root, 'funding');

			if (funding?.value.type === 'Array') {
				for (const element of funding.value.elements) {
					if (element.value.type === 'String') {
						checkValue(element.value);
					} else if (element.value.type === 'Object') {
						checkValue(findMember(element.value, 'url')?.value);
					}
				}
			} else {
				checkUrlField(funding);
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
