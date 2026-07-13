import globals from 'globals';
import xo from 'eslint-config-xo';
import jsdocPlugin from 'eslint-plugin-jsdoc';
import eslintPlugin from 'eslint-plugin-eslint-plugin';
import nodeStyleTextConfig from 'node-style-text/eslint-config';

const disabledJsdocRules = Object.fromEntries(Object.keys(jsdocPlugin.rules).map(name => [`jsdoc/${name}`, 'off']));

const xoConfig = xo().map(configBlock => {
	let block = configBlock;

	// `eslint-config-xo` defines the `json` plugin for `**/package.json`. Drop that
	// duplicate entry to avoid a flat-config plugin redefinition clash.
	if (block.files?.includes('**/package.json') && block.plugins?.json) {
		const {json, ...plugins} = block.plugins;
		block = {...block, plugins};
	}

	// We use `node:test`, not AVA. Remove the bundled `ava` plugin and its rules so they
	// don't misfire on our test files.
	if (block.plugins?.ava) {
		const {ava, ...plugins} = block.plugins;
		const rules = Object.fromEntries(Object.entries(block.rules ?? {}).filter(([name]) => !name.startsWith('ava/')));
		block = {...block, plugins, rules};
	}

	return block;
});

const config = [
	...xoConfig,
	nodeStyleTextConfig,
	{
		languageOptions: {
			globals: {
				...globals.node,
			},
		},
	},
	{
		ignores: [
			'coverage',
			'.ai-temporary',
			'test/fixtures/require-bin-shebang/**',
			'test/**/snapshots/**',
			'**/*.ts',
		],
	},
	{
		rules: disabledJsdocRules,
	},
	{
		files: ['**/*.js'],
		rules: {
			'no-sequences': ['error', {allowInParentheses: false}],
			'no-shadow': 'off',
			'no-unused-vars': 'off',
			'import/order': 'off',
			'func-names': 'off',
			'@stylistic/function-paren-newline': 'off',
			'@stylistic/curly-newline': 'off',
			// These `regexp/*` and `require-unicode-regexp` rules flag our own rule-implementation
			// regexes for stylistic reasons. They are simple, anchored, and run at lint time.
			'require-unicode-regexp': 'off',
			'regexp/prefer-named-capture-group': 'off',
			'regexp/strict': 'off',
			'regexp/optimal-quantifier-concatenation': 'off',
			// Flags `\.+$` in `description-format.js` for theoretical super-linear backtracking,
			// but that regex only ever runs on a string already confirmed to end with a period.
			'regexp/no-super-linear-move': 'off',
		},
	},
	{
		files: ['rules/*.js'],
		plugins: {
			'eslint-plugin': eslintPlugin,
		},
		rules: {
			...eslintPlugin.configs.all.rules,
			'eslint-plugin/require-meta-docs-description': ['error', {pattern: '.+'}],
			'eslint-plugin/require-meta-docs-recommended': ['error', {allowNonBoolean: true}],
			// `meta.docs.url` is injected centrally in `index.js`, not in each rule file.
			'eslint-plugin/require-meta-docs-url': 'off',
			'eslint-plugin/require-meta-schema-description': 'off',
			// Option defaults are read defensively in each rule (`context.options[0] ?? {}`).
			'eslint-plugin/require-meta-default-options': 'off',
			// `valid-fields` emits suggestions from sub-validator generators, so the static check cannot detect them.
			'eslint-plugin/require-meta-has-suggestions': 'off',
		},
	},
];

export default config;
