import npa from 'npm-package-arg';
import {
	getRootObject,
	iterateDependencies,
	optionsSchema,
	stringArraySchema,
} from './utils/index.js';

const MESSAGE_ID = 'no-local-dependencies';

const messages = {
	[MESSAGE_ID]: 'Local dependency `{{name}}` should not be published.',
};

// A consumer never installs `devDependencies`, so a local path there cannot break anyone: it is how packages point at test fixtures and self-link for dogfooding. Only the groups npm actually installs downstream are checked.
const installedDependencyTypes = ['dependencies', 'optionalDependencies', 'peerDependencies'];

// `link:` and `portal:` are the Yarn local-directory protocols, which `npm-package-arg` does not know.
const yarnLocalPrefixes = ['link:', 'portal:'];

/**
Check whether a dependency specifier references the local filesystem, the way npm resolves it.
*/
function isLocalSpecifier(name, specifier) {
	if (yarnLocalPrefixes.some(prefix => specifier.startsWith(prefix))) {
		return true;
	}

	try {
		const {type} = npa.resolve(name, specifier);
		return type === 'file' || type === 'directory';
	} catch {
		// `npm-package-arg` throws on a protocol it does not know, such as `workspace:`, and on a name npm cannot install.
		return false;
	}
}

/** @param {import('eslint').Rule.RuleContext} context */
const create = context => {
	const {ignore = []} = context.options[0] ?? {};

	return {
		Document(node) {
			const root = getRootObject(node);

			if (!root) {
				return;
			}

			for (const {member, name} of iterateDependencies(root, installedDependencyTypes)) {
				if (ignore.includes(name) || member.value.type !== 'String') {
					continue;
				}

				if (!isLocalSpecifier(name, member.value.value)) {
					continue;
				}

				context.report({
					node: member.value,
					messageId: MESSAGE_ID,
					data: {name},
				});
			}
		},
	};
};

/** @type {import('eslint').Rule.RuleModule} */
const config = {
	create,
	meta: {
		type: 'problem',
		docs: {
			description: 'Disallow local filesystem paths as dependency specifiers.',
			recommended: false,
		},
		schema: optionsSchema({ignore: stringArraySchema}),
		messages,
		languages: ['json/json'],
	},
};

export default config;
