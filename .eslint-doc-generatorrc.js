/** @type {import('eslint-doc-generator').GenerateOptions} */
const config = {
	configEmoji: [
		['recommended', '✅'],
	],
	ignoreConfig: [
		'all',
	],
	ruleDocTitleFormat: 'name',
	ruleListColumns: [
		'name',
		'description',
		'configsError',
		'fixable',
		'hasSuggestions',
	],
	urlConfigs: 'https://github.com/sindresorhus/eslint-package-json#configs',
};

export default config;
