import {outdent} from 'outdent';

const createMessages = data =>
	data.hasSuggestions
		? outdent`
			const MESSAGE_ID = '${data.id}';
			const SUGGESTION_ID = 'suggestion';

			const messages = {
				[MESSAGE_ID]: 'Unexpected {{value}}.',
				[SUGGESTION_ID]: 'Fix the problem.',
			};
		`
		: outdent`
			const MESSAGE_ID = '${data.id}';

			const messages = {
				[MESSAGE_ID]: 'Unexpected {{value}}.',
			};
		`;

const createRuleCreateFunction = () => outdent`
	/** @param {import('eslint').Rule.RuleContext} context */
	const create = context => ({
		Document(node) {
			const root = getRootObject(node);

			if (!root) {
				return;
			}

			// TODO: Implement the rule.
		},
	});
`;

const createConfig = data => outdent`
	/** @type {import('eslint').Rule.RuleModule} */
	const config = {
		create,
		meta: {
			type: '${data.type}',
			languages: ['json/json'],
			docs: {
				description: '${data.description}',
				recommended: false,
			},
	${data.fixableType ? `\t\tfixable: '${data.fixableType}',\n` : ''}${data.hasSuggestions ? '\t\thasSuggestions: true,\n' : ''}\t\tschema: [],
			messages,
		},
	};
`;

export default function renderRuleTemplate(data) {
	return [
		'import {getRootObject} from \'./utils/index.js\';',
		createMessages(data),
		createRuleCreateFunction(data),
		createConfig(data),
		'export default config;',
	].join('\n\n') + '\n';
}
