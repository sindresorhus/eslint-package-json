import {
	getRootObject,
	iterateDependencies,
	optionsSchema,
} from './utils/index.js';

const MESSAGE_ID = 'restricted';

const messages = {
	[MESSAGE_ID]: '{{message}}',
};

/**
Build a map of banned package name to its optional custom message.
*/
const toBannedMap = packages => new Map(packages.map(entry =>
	typeof entry === 'string' ? [entry, undefined] : [entry.name, entry.message]));

/** @param {import('eslint').Rule.RuleContext} context */
const create = context => {
	const {packages = []} = context.options[0] ?? {};
	const banned = toBannedMap(packages);

	return {
		Document(node) {
			const root = getRootObject(node);

			if (!root) {
				return;
			}

			for (const {member, name} of iterateDependencies(root)) {
				if (!banned.has(name)) {
					continue;
				}

				const message = banned.get(name) || `Do not use \`${name}\`.`;

				context.report({
					node: member.name,
					messageId: MESSAGE_ID,
					data: {message},
				});
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
			description: 'Disallow specific dependencies.',
			recommended: false,
		},
		schema: optionsSchema({
			packages: {
				type: 'array',
				items: {
					oneOf: [
						{
							type: 'string',
						},
						{
							type: 'object',
							properties: {
								name: {
									type: 'string',
								},
								message: {
									type: 'string',
								},
							},
							required: ['name'],
							additionalProperties: false,
						},
					],
				},
				uniqueItems: true,
			},
		}),
		messages,
		languages: ['json/json'],
	},
};

export default config;
