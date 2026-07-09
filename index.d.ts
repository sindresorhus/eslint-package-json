import type {ESLint, Linter} from 'eslint';

declare const eslintPackageJson: ESLint.Plugin & {
	configs: {
		recommended: Linter.Config;
		all: Linter.Config;
	};
};

export default eslintPackageJson;
