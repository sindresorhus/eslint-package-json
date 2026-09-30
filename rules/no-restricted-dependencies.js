import {
	getRootObject,
	iterateDependencies,
	optionsSchema,
	resolveAlias,
} from './utils/index.js';

const MESSAGE_ID = 'restricted';

const messages = {
	[MESSAGE_ID]: '{{message}}',
};

/**
The package name an `npm:` alias actually installs. A ban list names packages, and `npm:lodash@^4` puts the real `lodash` on disk under whatever key the alias uses, so a ban that only matched the key would be trivially bypassed.
*/
const getAliasedName = specifier => resolveAlias(specifier)?.name;

/**
Build a map of banned package name to its optional custom message.
*/
// An entry with a custom message wins over one without, the same as in `no-restricted-fields`, so the message the author wrote is never dropped for the default.
const toBannedMap = packages => {
	const banned = new Map();

	for (const entry of packages) {
		const {name, message} = typeof entry === 'string' ? {name: entry} : entry;

		if (message || !banned.get(name)) {
			banned.set(name, message);
		}
	}

	return banned;
};

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
				const aliasedName = member.value.type === 'String' ? getAliasedName(member.value.value) : undefined;
				const bannedName = banned.has(name) ? name : (aliasedName && banned.has(aliasedName) ? aliasedName : undefined);

				// `undefined` is "not banned"; an empty name is a name `no-restricted-fields` bans too, and the two rules would otherwise disagree on the same misconfiguration.
				if (bannedName === undefined) {
					continue;
				}

				const message = banned.get(bannedName) || `Do not use \`${bannedName}\`.`;

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
