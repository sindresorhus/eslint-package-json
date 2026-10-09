# no-short-flags-in-scripts

📝 Disallow short-form flags in scripts.

💼 This rule is enabled in the ✅ `recommended` [config](https://github.com/sindresorhus/eslint-package-json#configs).

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->
<!-- Do not manually modify this header. Run: `npm run fix:eslint-docs` -->

Use descriptive long-form flags in `scripts`, such as Prettier's `--write` and `--check`.

Checks simple commands, chains, leading environment assignments, and quoted arguments. Arguments beginning with a single dash and an ASCII letter are reported, including bundles and attached values. A standalone `--` ends checking for that command; redirection targets, bare `-`, and negative numbers are ignored.

Detection is lexical, so flag-looking values can also be reported. Commands with short-only or unconventional options can be exempted with `ignore`. Wrappers, executable paths, and nested shell commands are not resolved.

## Examples

```json
// ❌
{
	"scripts": {
		"format": "prettier -w .",
		"check": "prettier -c ."
	}
}
```

```json
// ✅
{
	"scripts": {
		"format": "prettier --write .",
		"check": "prettier --check ."
	}
}
```

## Autofixing

Fixes verified standalone aliases in a command's leading options. Fixing stops after a value-taking option or mode switch, or before an unknown option, positional argument, redirection, bundle, or attached value. Later flags are still reported. For example, `eslint -c config.js -f json` fixes only `-c`.

Fixes preserve script whitespace and quotes. Scripts containing `<<`, dollar signs, or backticks are not autofixed. Support is partial and command-specific; installed tool versions are not resolved.

CLIs with autofix support:

`alex`, `api-extractor`, `autoflake`, `autopep8`, `ava`, `babel`, `babel-node`, `bandit`, `basedpyright`, `bats`, `black`, `browserify`, `bun`, `bunzip2`, `bzcat`, `bzip2`, `c8`, `cargo`, `chokidar`, `clang-format`, `cleancss`, `codespell`, `coffee`, `commitlint`, `conc`, `concurrently`, `conventional-changelog`, `conventional-changelog-writer`, `conventional-commits-parser`, `conventional-recommended-bump`, `copyfiles`, `copyup`, `cpx`, `cspell`, `csso`, `csvclean`, `csvcut`, `csvformat`, `csvgrep`, `csvjoin`, `csvjson`, `csvlook`, `csvsort`, `csvsql`, `csvstack`, `csvstat`, `ctest`, `cucumber-js`, `curl`, `del-cli`, `depcruise`, `dependency-cruise`, `dependency-cruiser`, `docformatter`, `dpdm`, `dprint`, `ejs`, `env-cmd`, `eslint`, `eslint_d`, `fd`, `fdfind`, `firebase`, `flake8`, `git`, `gmake`, `golangci-lint`, `gradle`, `grunt`, `gulp`, `gunzip`, `gzip`, `hatch`, `html-minifier`, `html-minifier-terser`, `html-validate`, `htmlhint`, `http`, `https`, `hugo`, `hyperfine`, `in2csv`, `isort`, `jest`, `jless`, `jq`, `jscpd`, `jscs`, `jsdoc`, `jshint`, `json5`, `jsonlint`, `just`, `knip`, `lessc`, `lightningcss`, `lint-staged`, `lychee`, `lz4`, `madge`, `markdown-it`, `markdownlint`, `marked`, `mkdirp`, `mkdocs`, `mocha`, `mvn`, `mypy`, `ncc`, `ncu`, `nexe`, `next`, `ninja`, `node`, `node-dev`, `nodemon`, `nox`, `npm`, `npm-check`, `npm-check-updates`, `npm-run-all`, `npm-run-all2`, `npmPkgJsonLint`, `npx`, `nyc`, `onchange`, `oxfmt`, `oxlint`, `pa11y`, `pandoc`, `pdm`, `pip`, `pip3`, `pipenv`, `pnpm`, `poetry`, `postcss`, `prettier`, `prettier-eslint`, `prettier-package-json`, `pug`, `pug-cli`, `pug-lint`, `purgecss`, `py.test`, `pycodestyle`, `pydocstyle`, `pylint`, `pyright`, `pytest`, `qunit`, `rclone`, `rehype`, `release-it`, `remark`, `rg`, `rimraf`, `rollup`, `rsync`, `rubocop`, `ruff`, `run-p`, `run-s`, `rush`, `rustc`, `rustfmt`, `sass`, `sass-lint`, `semver`, `serve`, `shellcheck`, `shfmt`, `sort-package-json`, `sphinx-build`, `standard-changelog`, `standard-version`, `stylelint`, `stylus`, `sucrase`, `svgo`, `swc`, `tap`, `tape`, `terser`, `testcafe`, `textlint`, `ts-node`, `ts-node-esm`, `ts-node-transpile-only`, `ts-standard`, `tsc`, `tsc-alias`, `tsd`, `tsgo`, `tsup`, `tsx`, `turbo`, `uglifyjs`, `uncss`, `unxz`, `unzstd`, `uv`, `vc`, `vercel`, `vite`, `vitest`, `vue-tsc`, `vulture`, `wait-on`, `watchexec`, `watchify`, `wds`, `web-dev-server`, `webpack`, `webpack-bundle-analyzer`, `webpack-cli`, `webpack-dev-server`, `wrangler`, `wrangler2`, `xz`, `xzcat`, `yamllint`, `yapf`, `zcat`, `zstd`, `zstdcat`.

## Options

### `ignore`

Type: `string[]`\
Default: `[]`

Exact, case-sensitive executable names to exempt from reporting and fixing. Quotes are removed before matching, but paths and extensions are not normalized: `sh`, `./sh`, and `sh.cmd` are distinct. The default is empty; ignoring a command does not exempt later commands in a chain.

Consider these entries when your scripts need short-only or portable options:

- Shells and builtins: `[`, `bash`, `dash`, `echo`, `env`, `set`, `sh`, `test`, `zsh`.
- Portable utilities: `awk`, `chmod`, `cp`, `cut`, `date`, `find`, `kill`, `ln`, `mkdir`, `mv`, `rm`, `sed`, `tail`, `tee`, `touch`, `unzip`, `wc`, `xargs`.
- Developer tools: `git`, `make`, `python`, `python3`, `scp`, `ssh`.

For projects using them, also consider `c++`, `cc`, `clang`, `clang++`, `cmake`, `g++`, `gcc`, `java`, `javac`, `perl`, and `ruby`. Add only the commands you need: an ignored CLI also loses its available autofixes. Many GNU utilities have long flags that their macOS counterparts lack, while `test` and `[` use flag-looking expression operators.

```js
{
	'package-json/no-short-flags-in-scripts': [
		'error',
		{
			ignore: [
				'sh',
				'git',
			],
		},
	],
}
```

With `{ignore: ['sh', 'git']}`:

```json
// ❌
{
	"scripts": {
		"format": "sh -c 'echo ready' && prettier -w ."
	}
}
```

```json
// ✅
{
	"scripts": {
		"format": "sh -c 'echo ready' && prettier --write .",
		"status": "git -C repo status"
	}
}
```
