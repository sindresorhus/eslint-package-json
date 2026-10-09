# no-short-flags-in-scripts

📝 Disallow short-form flags in scripts.

💼 This rule is enabled in the ✅ `recommended` [config](https://github.com/sindresorhus/eslint-package-json#configs).

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->
<!-- Do not manually modify this header. Run: `npm run fix:eslint-docs` -->

Use descriptive long-form flags in `scripts`, such as Prettier's `--write` and `--check`.

Checks simple commands, chains, leading environment assignments, and quoted arguments. Arguments beginning with a single dash and an ASCII letter are reported, including bundles and attached values. A standalone `--` ends checking for that command; redirection targets, bare `-`, and negative numbers are ignored.

Detection is lexical, so flag-looking values can also be reported. Common commands with unavoidable single-dash syntax are exempt. Other commands can be exempted with `ignore`. Wrappers, executable paths, and nested shell commands are not resolved.

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

## Built-in exemptions

These commands are always exempt from reporting and fixing because common options have no usable or portable long equivalent:

- Shells and builtins: `[`, `bash`, `dash`, `echo`, `env`, `set`, `sh`, `test`, `zsh`.
- Portable utilities: `awk`, `chmod`, `cp`, `cut`, `date`, `find`, `kill`, `ln`, `mkdir`, `mv`, `rm`, `sed`, `tail`, `tee`, `touch`, `unzip`, `wc`, `xargs`.
- Developer tools: `c++`, `cc`, `clang`, `clang++`, `cmake`, `g++`, `gcc`, `git`, `java`, `javac`, `make`, `perl`, `python`, `python3`, `ruby`, `scp`, `ssh`.
- Media tools: `ffmpeg`, `ffprobe`.

Exemptions match exact, case-sensitive executable names after removing quotes. Later commands in a chain are still checked.

## Autofixing

Fixes verified standalone aliases in a command's leading options. Fixing stops after a value-taking option or mode switch, or before an unknown option, positional argument, redirection, bundle, or attached value. Later flags are still reported. For example, `eslint -c config.js -f json` fixes only `-c`.

Fixes preserve script whitespace and quotes. Scripts containing `<<`, dollar signs, or backticks are not autofixed. Support is partial and command-specific; installed tool versions are not resolved.

Vite, Vitest, and tsup remain report-only because mixing short and long aliases can change option precedence.

CLIs with autofix support:

`alex`, `api-extractor`, `autoflake`, `autopep8`, `ava`, `babel`, `babel-node`, `bandit`, `basedpyright`, `bats`, `black`, `browserify`, `bun`, `bunzip2`, `bzcat`, `bzip2`, `c8`, `cargo`, `chokidar`, `clang-format`, `cleancss`, `codespell`, `coffee`, `commitlint`, `conc`, `concurrently`, `conventional-changelog`, `conventional-changelog-writer`, `conventional-commits-parser`, `conventional-recommended-bump`, `copyfiles`, `copyup`, `cpx`, `cspell`, `csso`, `csvclean`, `csvcut`, `csvformat`, `csvgrep`, `csvjoin`, `csvjson`, `csvlook`, `csvsort`, `csvsql`, `csvstack`, `csvstat`, `ctest`, `cucumber-js`, `curl`, `del-cli`, `depcruise`, `dependency-cruise`, `dependency-cruiser`, `docformatter`, `dpdm`, `dprint`, `ejs`, `env-cmd`, `eslint`, `eslint_d`, `fd`, `fdfind`, `firebase`, `flake8`, `gmake`, `golangci-lint`, `gradle`, `grunt`, `gulp`, `gunzip`, `gzip`, `hatch`, `html-minifier`, `html-minifier-terser`, `html-validate`, `htmlhint`, `http`, `https`, `hugo`, `hyperfine`, `in2csv`, `isort`, `jest`, `jless`, `jq`, `jscpd`, `jscs`, `jsdoc`, `jshint`, `json5`, `jsonlint`, `just`, `knip`, `lessc`, `lightningcss`, `lint-staged`, `lychee`, `lz4`, `madge`, `markdown-it`, `markdownlint`, `marked`, `mkdirp`, `mkdocs`, `mocha`, `mvn`, `mypy`, `ncc`, `ncu`, `nexe`, `next`, `ninja`, `node`, `node-dev`, `nodemon`, `nox`, `npm`, `npm-check`, `npm-check-updates`, `npm-run-all`, `npm-run-all2`, `npmPkgJsonLint`, `npx`, `nyc`, `onchange`, `oxfmt`, `oxlint`, `pa11y`, `pandoc`, `pdm`, `pip`, `pip3`, `pipenv`, `pnpm`, `poetry`, `postcss`, `prettier`, `prettier-eslint`, `prettier-package-json`, `pug`, `pug-cli`, `pug-lint`, `purgecss`, `py.test`, `pycodestyle`, `pydocstyle`, `pylint`, `pyright`, `pytest`, `qunit`, `rclone`, `rehype`, `release-it`, `remark`, `rg`, `rimraf`, `rollup`, `rsync`, `rubocop`, `ruff`, `run-p`, `run-s`, `rush`, `rustc`, `rustfmt`, `sass`, `sass-lint`, `semver`, `serve`, `shellcheck`, `shfmt`, `sort-package-json`, `sphinx-build`, `standard-changelog`, `standard-version`, `stylelint`, `stylus`, `sucrase`, `svgo`, `swc`, `tap`, `tape`, `terser`, `testcafe`, `textlint`, `ts-node`, `ts-node-esm`, `ts-node-transpile-only`, `ts-standard`, `tsc`, `tsc-alias`, `tsd`, `tsgo`, `tsx`, `turbo`, `uglifyjs`, `uncss`, `unxz`, `unzstd`, `uv`, `vc`, `vercel`, `vue-tsc`, `vulture`, `wait-on`, `watchexec`, `watchify`, `wds`, `web-dev-server`, `webpack`, `webpack-bundle-analyzer`, `webpack-cli`, `webpack-dev-server`, `wrangler`, `wrangler2`, `xz`, `xzcat`, `yamllint`, `yapf`, `zcat`, `zstd`, `zstdcat`.

## Options

### `ignore`

Type: `string[]`\
Default: `[]`

Additional exact, case-sensitive executable names to exempt from reporting and fixing. Built-in exemptions always apply, including when `ignore` is empty. Quotes are removed before matching, but paths and extensions are not normalized: `sh`, `./sh`, and `sh.cmd` are distinct. Ignoring a command also disables its available autofixes; later commands in a chain are still checked.

```js
{
	'package-json/no-short-flags-in-scripts': [
		'error',
		{
			ignore: [
				'custom-tool',
			],
		},
	],
}
```

With `{ignore: ['custom-tool']}`:

```json
// ❌
{
	"scripts": {
		"format": "sh -c 'echo ready' && custom-tool -x && prettier -w ."
	}
}
```

```json
// ✅
{
	"scripts": {
		"format": "sh -c 'echo ready' && custom-tool -x && prettier --write .",
		"status": "git -C repo status"
	}
}
```
