import {getRootObject} from './utils/index.js';
import * as name from './valid-fields/name.js';
import * as version from './valid-fields/version.js';
import * as private_ from './valid-fields/private.js';
import * as description from './valid-fields/description.js';
import * as license from './valid-fields/license.js';
import * as repository from './valid-fields/repository.js';
import * as homepage from './valid-fields/homepage.js';
import * as bugs from './valid-fields/bugs.js';
import * as funding from './valid-fields/funding.js';
import * as author from './valid-fields/author.js';
import * as type from './valid-fields/type.js';
import * as exports from './valid-fields/exports.js';
import * as imports from './valid-fields/imports.js';
import * as bin from './valid-fields/bin.js';
import * as man from './valid-fields/man.js';
import * as sideEffects from './valid-fields/side-effects.js';
import * as engines from './valid-fields/engines.js';
import * as devEngines from './valid-fields/dev-engines.js';
import * as os from './valid-fields/os.js';
import * as cpu from './valid-fields/cpu.js';
import * as publishConfig from './valid-fields/publish-config.js';
import * as packageManager from './valid-fields/package-manager.js';
import * as scripts from './valid-fields/scripts.js';
import * as files from './valid-fields/files.js';
import * as workspaces from './valid-fields/workspaces.js';
import * as keywords from './valid-fields/keywords.js';
import * as dependencies from './valid-fields/dependencies.js';
import * as peerDependenciesMeta from './valid-fields/peer-dependencies-meta.js';
import * as bundleDependencies from './valid-fields/bundle-dependencies.js';
import * as overrides from './valid-fields/overrides.js';

/*
Each field validator lives in its own file under `valid-fields/` and exports a `messages` map plus a `check(root, context)` generator that yields report descriptors. Message ids are namespaced by field so they stay unique across the merged rule.
*/
const fields = {
	name,
	version,
	private: private_,
	description,
	license,
	repository,
	homepage,
	bugs,
	funding,
	author,
	type,
	exports,
	imports,
	bin,
	man,
	sideEffects,
	engines,
	devEngines,
	os,
	cpu,
	publishConfig,
	packageManager,
	scripts,
	files,
	workspaces,
	keywords,
	dependencies,
	peerDependenciesMeta,
	bundleDependencies,
	overrides,
};

const messages = Object.fromEntries(
	Object.entries(fields).flatMap(([field, validator]) =>
		Object.entries(validator.messages).map(([id, text]) => [`${field}/${id}`, text]),
	),
);

/**
Prefix a report's `messageId` (and any suggestion message ids) with its field so it resolves against the merged `messages` map.
*/
const namespaceReport = (field, report) => {
	const namespaced = {...report, messageId: `${field}/${report.messageId}`};

	if (report.suggest) {
		namespaced.suggest = report.suggest.map(suggestion => ({
			...suggestion,
			messageId: `${field}/${suggestion.messageId}`,
		}));
	}

	return namespaced;
};

/** @param {import('eslint').Rule.RuleContext} context */
const create = context => ({
	Document(node) {
		const root = getRootObject(node);

		if (!root) {
			return;
		}

		for (const [field, validator] of Object.entries(fields)) {
			for (const report of validator.check(root, context)) {
				context.report(namespaceReport(field, report));
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
			description: 'Enforce valid values for package.json fields.',
			recommended: true,
		},
		fixable: 'code',
		hasSuggestions: true,
		schema: [],
		messages,
		languages: ['json/json'],
	},
};

export default config;
