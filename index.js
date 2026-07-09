import json from '@eslint/json';
import * as rawRules from './rules/index.js';
import packageJson from './package.json' with {type: 'json'};

const repositoryUrl = 'https://github.com/sindresorhus/eslint-package-json';

const rules = Object.fromEntries(Object.entries(rawRules).map(([ruleId, rule]) => [
	ruleId,
	{
		...rule,
		meta: {
			...rule.meta,
			docs: {
				...rule.meta.docs,
				url: `${repositoryUrl}/blob/main/docs/rules/${ruleId}.md`,
			},
		},
	},
]));

const plugin = {
	meta: {
		// The plugin's namespace, matching how rules are referenced (`package-json/<rule>`).
		name: 'package-json',
		version: packageJson.version,
	},
	rules,
};

const createConfig = (name, ruleEntries) => ({
	name,
	files: ['**/package.json'],
	plugins: {
		'package-json': plugin,
		json,
	},
	language: 'json/json',
	rules: ruleEntries,
});

const recommendedRules = Object.fromEntries(Object.entries(rules)
	.filter(([, rule]) => rule.meta.docs.recommended)
	.map(([ruleId]) => [`package-json/${ruleId}`, 'error']));

const allRules = Object.fromEntries(Object.keys(rules).map(ruleId => [`package-json/${ruleId}`, 'error']));

plugin.configs = {
	recommended: createConfig('package-json/recommended', recommendedRules),
	all: createConfig('package-json/all', allRules),
};

export default plugin;
