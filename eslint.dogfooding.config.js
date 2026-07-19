import packageJson from './index.js';

// Run every rule against the project's own `package.json` files. The rules only apply to
// `package.json`, so ignore all other source. Scanning JS would trip over `eslint-disable`
// directives for plugins (`unicorn`, `node-test`) that this minimal config doesn't load.
const config = [
	{
		ignores: [
			'coverage',
			'.ai-temporary',
			'**/*.js',
			'**/*.cjs',
			'**/*.mjs',
		],
	},
	packageJson.configs.all,
	{
		// This project is published, so the opt-in rule intentionally does not apply to its own package.
		rules: {
			'package-json/require-private': 'off',
		},
	},
];

export default config;
