# no-short-flags-in-scripts

📝 Disallow short-form flags in scripts.

💼 This rule is enabled in the ✅ `recommended` [config](https://github.com/sindresorhus/eslint-package-json#configs).

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->
<!-- Do not manually modify this header. Run: `npm run fix:eslint-docs` -->

Use descriptive long-form flags in `scripts` so readers do not need to look up what each letter means. For example, Prettier's `--write` and `--check` communicate more than `-w` and `-c`.

Checks arguments in simple commands, including command chains, leading environment assignments, and quoted words. A standalone `--` ends checking for that invocation. Redirection targets, bare `-`, negative numbers, and text inside a quoted command string are not checked.

Detection is lexical: arguments starting with a single dash and an ASCII letter are considered short-form flags, including bundles (`-rf`), attached values (`-p80`), and single-dash multi-letter options (`-name`). Each script receives one report identifying its first offending argument. The rule cannot distinguish every flag from an option value or verify that a long equivalent exists. Use `ignore` for commands with legitimate short-only flags, such as `sh -c` or `git -C`.

Wrappers are not unwrapped, executable paths are not resolved, and shell expansion, nested commands, and compound shell syntax are unsupported. For example, `npx prettier -w .` is checked as an `npx` invocation, and `sh -c 'prettier -w .'` checks `sh -c` without inspecting the quoted command.

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

Known standalone aliases at the start of these direct invocations can be autofixed. Command links point to upstream alias definitions.

| Command | Aliases |
| :-- | :-- |
| [`alex`](https://github.com/get-alex/alex/blob/main/cli.js) | `-v` → `--version`, `-h` → `--help`, `-t` → `--text`, `-l` → `--html`, `-d` → `--diff`, `-q` → `--quiet`, `-w` → `--why` |
| [`api-extractor`](https://github.com/microsoft/rushstack/blob/main/apps/api-extractor/src/cli/ApiExtractorCommandLine.ts) | `-d` → `--debug` |
| [`autoflake`](https://github.com/PyCQA/autoflake/blob/main/autoflake.py) | `-c` → `--check`, `-r` → `--recursive`, `-j` → `--jobs`, `-v` → `--verbose`, `-i` → `--in-place`, `-s` → `--stdout`, `-h` → `--help` |
| [`autopep8`](https://github.com/hhatto/autopep8/blob/main/autopep8.py) | `-v` → `--verbose`, `-d` → `--diff`, `-i` → `--in-place`, `-r` → `--recursive`, `-j` → `--jobs`, `-p` → `--pep8-passes`, `-a` → `--aggressive`, `-h` → `--help` |
| [`ava`](https://github.com/avajs/ava/blob/v8.0.1/lib/cli.js) | `-c` → `--concurrency`, `-m` → `--match`, `-s` → `--serial`, `-t` → `--tap`, `-T` → `--timeout`, `-u` → `--update-snapshots`, `-v` → `--verbose`, `-w` → `--watch` |
| [`babel`](https://github.com/babel/babel/blob/main/packages/babel-cli/src/babel/options.ts) | `-w` → `--watch`, `-D` → `--copy-files`, `-f` → `--filename`, `-s` → `--source-maps`, `-x` → `--extensions`, `-o` → `--out-file`, `-d` → `--out-dir` |
| [`babel-node`](https://github.com/babel/babel/blob/main/packages/babel-node/src/program-setup.ts) | `-e` → `--eval`, `-r` → `--require`, `-p` → `--print`, `-o` → `--only`, `-i` → `--ignore`, `-x` → `--extensions`, `-w` → `--plugins`, `-b` → `--presets` |
| [`basedpyright`](https://github.com/DetachHead/basedpyright/blob/main/packages/pyright-internal/src/pyright.ts) | `-h` → `--help`, `-p` → `--project`, `-t` → `--typeshedpath`, `-v` → `--venvpath`, `-w` → `--watch` |
| [`bats`](https://github.com/bats-core/bats-core/blob/master/libexec/bats-core/bats) | `-c` → `--count`, `-f` → `--filter`, `-F` → `--formatter`, `-o` → `--output`, `-p` → `--pretty`, `-j` → `--jobs`, `-r` → `--recursive`, `-t` → `--tap`, `-T` → `--timing`, `-x` → `--trace`, `-h` → `--help`, `-v` → `--version` |
| [`black`](https://github.com/psf/black/blob/main/src/black/__init__.py) | `-c` → `--code`, `-l` → `--line-length`, `-t` → `--target-version`, `-x` → `--skip-source-first-line`, `-S` → `--skip-string-normalization`, `-C` → `--skip-magic-trailing-comma`, `-W` → `--workers`, `-q` → `--quiet`, `-v` → `--verbose`, `-h` → `--help` |
| [`browserify`](https://github.com/browserify/browserify/blob/master/bin/args.js) | `-d` → `--debug`, `-s` → `--standalone`, `-r` → `--require`, `-u` → `--exclude`, `-x` → `--external`, `-t` → `--transform`, `-i` → `--ignore`, `-o` → `--outfile`, `-e` → `--entry`, `-c` → `--command` |
| [`bun`](https://github.com/oven-sh/bun/blob/main/src/runtime/cli/Arguments.rs) | `-c` → `--config`, `-l` → `--loader`, `-F` → `--filter`, `-b` → `--bun`, `-h` → `--help`, `-v` → `--version` |
| [`bunzip2`](https://github.com/apple-oss-distributions/bzip2/blob/main/bzip2/bzip2.c) | `-c` → `--stdout`, `-f` → `--force`, `-k` → `--keep`, `-s` → `--small`, `-q` → `--quiet`, `-v` → `--verbose` |
| [`bzcat`](https://github.com/apple-oss-distributions/bzip2/blob/main/bzip2/bzip2.c) | `-c` → `--stdout`, `-f` → `--force`, `-k` → `--keep`, `-s` → `--small`, `-q` → `--quiet`, `-v` → `--verbose` |
| [`bzip2`](https://github.com/apple-oss-distributions/bzip2/blob/main/bzip2/bzip2.c) | `-c` → `--stdout`, `-f` → `--force`, `-k` → `--keep`, `-s` → `--small`, `-q` → `--quiet`, `-v` → `--verbose` |
| [`c8`](https://github.com/bcoe/c8/blob/v12.0.0/lib/parse-args.js) | `-c` → `--config`, `-r` → `--reporter`, `-o` → `--reports-dir`, `-n` → `--include`, `-x` → `--exclude`, `-e` → `--extension`, `-a` → `--exclude-after-remap` |
| [`cargo`](https://github.com/rust-lang/cargo/blob/master/src/bin/cargo/cli.rs) | `-v` → `--verbose`, `-q` → `--quiet`, `-V` → `--version` |
| [`chokidar`](https://github.com/open-cli-tools/chokidar-cli/blob/master/index.js) | `-c` → `--command`, `-d` → `--debounce`, `-t` → `--throttle`, `-s` → `--follow-symlinks`, `-i` → `--ignore`, `-p` → `--polling`, `-h` → `--help`, `-v` → `--version` |
| [`clang-format`](https://github.com/llvm/llvm-project/blob/main/clang/tools/clang-format/ClangFormat.cpp) | `-n` → `--dry-run` |
| [`cleancss`](https://github.com/clean-css/clean-css-cli/blob/master/index.js) | `-b` → `--batch`, `-c` → `--compatibility`, `-d` → `--debug`, `-f` → `--format`, `-h` → `--help`, `-o` → `--output`, `-v` → `--version` |
| [`codespell`](https://github.com/codespell-project/codespell/blob/main/codespell_lib/_codespell.py) | `-d` → `--disable-colors`, `-c` → `--enable-colors`, `-w` → `--write-changes`, `-D` → `--dictionary`, `-I` → `--ignore-words`, `-L` → `--ignore-words-list`, `-r` → `--regex`, `-s` → `--summary`, `-S` → `--skip`, `-x` → `--exclude-file`, `-i` → `--interactive`, `-q` → `--quiet-level`, `-e` → `--hard-encoding-detection`, `-f` → `--check-filenames`, `-H` → `--check-hidden`, `-A` → `--after-context`, `-B` → `--before-context`, `-C` → `--context`, `-h` → `--help` |
| [`coffee`](https://github.com/jashkenas/coffeescript/blob/main/src/command.coffee) | `-b` → `--bare`, `-c` → `--compile`, `-e` → `--eval`, `-h` → `--help`, `-i` → `--interactive`, `-j` → `--join`, `-l` → `--literate`, `-m` → `--map`, `-M` → `--inline-map`, `-n` → `--nodes`, `-o` → `--output`, `-p` → `--print`, `-r` → `--require`, `-s` → `--stdio`, `-t` → `--transpile`, `-v` → `--version`, `-w` → `--watch` |
| [`commitlint`](https://github.com/conventional-changelog/commitlint/blob/master/@commitlint/cli/src/cli.ts) | `-c` → `--color`, `-g` → `--config`, `-d` → `--cwd`, `-e` → `--edit`, `-E` → `--env`, `-x` → `--extends`, `-H` → `--help-url`, `-f` → `--from`, `-l` → `--last`, `-o` → `--format`, `-p` → `--parser-preset`, `-q` → `--quiet`, `-t` → `--to`, `-V` → `--verbose`, `-s` → `--strict`, `-v` → `--version`, `-h` → `--help` |
| [`conc`](https://github.com/open-cli-tools/concurrently/blob/main/bin/index.ts) | `-r` → `--raw`, `-g` → `--group`, `-k` → `--kill-others`, `-i` → `--handle-input`, `-m` → `--max-processes`, `-n` → `--names`, `-P` → `--passthrough-arguments`, `-p` → `--prefix`, `-c` → `--prefix-colors`, `-l` → `--prefix-length`, `-t` → `--timestamp-format` |
| [`concurrently`](https://github.com/open-cli-tools/concurrently/blob/main/bin/index.ts) | `-r` → `--raw`, `-g` → `--group`, `-k` → `--kill-others`, `-i` → `--handle-input`, `-m` → `--max-processes`, `-n` → `--names`, `-P` → `--passthrough-arguments`, `-p` → `--prefix`, `-c` → `--prefix-colors`, `-l` → `--prefix-length`, `-t` → `--timestamp-format` |
| [`conventional-changelog`](https://github.com/conventional-changelog/conventional-changelog/blob/conventional-changelog-cli-v5.0.0/packages/conventional-changelog-cli/cli.js) | `-i` → `--infile`, `-o` → `--outfile`, `-p` → `--preset`, `-k` → `--pkg`, `-a` → `--append`, `-r` → `--release-count`, `-u` → `--output-unreleased`, `-v` → `--verbose`, `-n` → `--config`, `-c` → `--context`, `-l` → `--lerna-package`, `-t` → `--tag-prefix` |
| [`conventional-changelog-writer`](https://github.com/conventional-changelog/conventional-changelog/blob/master/packages/conventional-changelog-writer/src/cli/index.ts) | `-c` → `--context`, `-o` → `--options` |
| [`conventional-commits-parser`](https://github.com/conventional-changelog/conventional-changelog/blob/master/packages/conventional-commits-parser/src/cli/index.ts) | `-s` → `--separator`, `-p` → `--header-pattern`, `-c` → `--header-correspondence`, `-r` → `--reference-actions`, `-i` → `--issue-prefixes`, `-n` → `--note-keywords`, `-f` → `--field-pattern`, `-v` → `--verbose` |
| [`conventional-recommended-bump`](https://github.com/conventional-changelog/conventional-changelog/blob/master/packages/conventional-recommended-bump/src/cli/index.ts) | `-p` → `--preset`, `-g` → `--config`, `-v` → `--verbose`, `-l` → `--lerna-package`, `-t` → `--tag-prefix`, `-h` → `--header-pattern`, `-c` → `--header-correspondence`, `-r` → `--reference-actions`, `-i` → `--issue-prefixes`, `-n` → `--note-keywords`, `-f` → `--field-pattern` |
| [`copyfiles`](https://github.com/calvinmetcalf/copyfiles/blob/master/copyfiles) | `-a` → `--all`, `-f` → `--flat`, `-E` → `--error`, `-V` → `--verbose`, `-s` → `--soft`, `-F` → `--follow`, `-u` → `--up`, `-e` → `--exclude` |
| [`copyup`](https://github.com/calvinmetcalf/copyfiles/blob/master/copyfiles) | `-a` → `--all`, `-f` → `--flat`, `-E` → `--error`, `-V` → `--verbose`, `-s` → `--soft`, `-F` → `--follow`, `-u` → `--up`, `-e` → `--exclude` |
| [`cspell`](https://github.com/streetsidesoftware/cspell/blob/9550bbc967a4befe527d6440659e6534eddbcc2e/packages/cspell/src/commandLint.ts) | `-c` → `--config`, `-v` → `--verbose`, `-u` → `--unique`, `-e` → `--exclude`, `-r` → `--root` |
| [`ctest`](https://github.com/Kitware/CMake/blob/master/Source/cmCTest.cxx) | `-D` → `--dashboard`, `-T` → `--test-action`, `-M` → `--test-model`, `-S` → `--script`, `-j` → `--parallel`, `-C` → `--build-config`, `-Q` → `--quiet`, `-V` → `--verbose`, `-O` → `--output-log`, `-W` → `--max-width`, `-A` → `--add-notes`, `-I` → `--tests-information`, `-U` → `--union`, `-R` → `--tests-regex`, `-E` → `--exclude-regex`, `-L` → `--label-regex` |
| [`cucumber-js`](https://github.com/cucumber/cucumber-js/blob/81936501473191a4fe7fb0f26f51e455305c9d4a/src/configuration/argv_parser.ts) | `-b` → `--backtrace`, `-c` → `--config`, `-d` → `--dry-run`, `-f` → `--format`, `-i` → `--import`, `-l` → `--loader`, `-p` → `--profile`, `-r` → `--require`, `-t` → `--tags`, `-v` → `--version` |
| [`curl`](https://github.com/curl/curl/blob/master/src/tool_getparam.c) | `-a` → `--append`, `-A` → `--user-agent`, `-b` → `--cookie`, `-B` → `--use-ascii`, `-c` → `--cookie-jar`, `-C` → `--continue-at`, `-d` → `--data`, `-D` → `--dump-header`, `-e` → `--referer`, `-E` → `--cert`, `-f` → `--fail`, `-F` → `--form`, `-g` → `--globoff`, `-G` → `--get`, `-h` → `--help`, `-H` → `--header`, `-i` → `--include`, `-I` → `--head`, `-j` → `--junk-session-cookies`, `-J` → `--remote-header-name`, `-k` → `--insecure`, `-K` → `--config`, `-l` → `--list-only`, `-L` → `--location`, `-m` → `--max-time`, `-M` → `--manual`, `-n` → `--netrc`, `-N` → `--no-buffer`, `-o` → `--output`, `-O` → `--remote-name`, `-p` → `--proxytunnel`, `-P` → `--ftp-port`, `-q` → `--disable`, `-Q` → `--quote`, `-r` → `--range`, `-R` → `--remote-time`, `-s` → `--silent`, `-S` → `--show-error`, `-t` → `--telnet-option`, `-T` → `--upload-file`, `-u` → `--user`, `-U` → `--proxy-user`, `-v` → `--verbose`, `-V` → `--version`, `-w` → `--write-out`, `-x` → `--proxy`, `-X` → `--request`, `-y` → `--speed-time`, `-Y` → `--speed-limit`, `-z` → `--time-cond`, `-Z` → `--parallel` |
| [`del-cli`](https://github.com/sindresorhus/del-cli/blob/main/cli.js) | `-f` → `--force`, `-d` → `--dry-run`, `-v` → `--verbose` |
| [`depcruise`](https://github.com/sverweij/dependency-cruiser/blob/main/bin/dependency-cruiser.mjs) | `-c` → `--config`, `-T` → `--output-type`, `-m` → `--metrics`, `-f` → `--output-to`, `-I` → `--include-only`, `-F` → `--focus`, `-R` → `--reaches`, `-A` → `--affected`, `-H` → `--highlight`, `-x` → `--exclude`, `-X` → `--do-not-follow`, `-S` → `--collapse`, `-d` → `--max-depth`, `-M` → `--module-systems`, `-P` → `--prefix`, `-C` → `--cache`, `-p` → `--progress`, `-v` → `--validate`, `-i` → `--info`, `-h` → `--help`, `-V` → `--version` |
| [`dependency-cruise`](https://github.com/sverweij/dependency-cruiser/blob/main/bin/dependency-cruiser.mjs) | `-c` → `--config`, `-T` → `--output-type`, `-m` → `--metrics`, `-f` → `--output-to`, `-I` → `--include-only`, `-F` → `--focus`, `-R` → `--reaches`, `-A` → `--affected`, `-H` → `--highlight`, `-x` → `--exclude`, `-X` → `--do-not-follow`, `-S` → `--collapse`, `-d` → `--max-depth`, `-M` → `--module-systems`, `-P` → `--prefix`, `-C` → `--cache`, `-p` → `--progress`, `-v` → `--validate`, `-i` → `--info`, `-h` → `--help`, `-V` → `--version` |
| [`dependency-cruiser`](https://github.com/sverweij/dependency-cruiser/blob/main/bin/dependency-cruiser.mjs) | `-c` → `--config`, `-T` → `--output-type`, `-m` → `--metrics`, `-f` → `--output-to`, `-I` → `--include-only`, `-F` → `--focus`, `-R` → `--reaches`, `-A` → `--affected`, `-H` → `--highlight`, `-x` → `--exclude`, `-X` → `--do-not-follow`, `-S` → `--collapse`, `-d` → `--max-depth`, `-M` → `--module-systems`, `-P` → `--prefix`, `-C` → `--cache`, `-p` → `--progress`, `-v` → `--validate`, `-i` → `--info`, `-h` → `--help`, `-V` → `--version` |
| [`docformatter`](https://github.com/PyCQA/docformatter/blob/master/src/docformatter/configuration.py) | `-i` → `--in-place`, `-c` → `--check`, `-d` → `--diff`, `-r` → `--recursive`, `-e` → `--exclude`, `-n` → `--non-cap`, `-s` → `--style`, `-h` → `--help` |
| [`dpdm`](https://github.com/acrazing/dpdm/blob/master/src/bin/dpdm.ts) | `-o` → `--output`, `-T` → `--transform`, `-h` → `--help` |
| [`dprint`](https://github.com/dprint/dprint/blob/080b246b3576f0d199b5481fa91c88305c50ccb1/crates/dprint/src/arg_parser.rs) | `-c` → `--config`, `-L` → `--log-level` |
| [`ejs`](https://github.com/mde/ejs/blob/main/bin/cli.js) | `-o` → `--output-file`, `-f` → `--data-file`, `-i` → `--data-input`, `-m` → `--delimiter`, `-p` → `--open-delimiter`, `-c` → `--close-delimiter`, `-l` → `--locals-name`, `-s` → `--strict`, `-n` → `--no-with`, `-w` → `--rm-whitespace`, `-d` → `--debug`, `-h` → `--help`, `-V` → `--version`, `-v` → `--version` |
| [`env-cmd`](https://github.com/toddbluhm/env-cmd/blob/master/src/parse-args.ts) | `-e` → `--environments`, `-f` → `--file`, `-x` → `--expand-envs`, `-v` → `--version` |
| [`eslint`](https://github.com/eslint/eslint/blob/main/lib/options.js) | `-c` → `--config`, `-o` → `--output-file`, `-f` → `--format`, `-h` → `--help`, `-v` → `--version` |
| [`eslint_d`](https://github.com/mantoni/eslint_d.js/blob/5562045e54e6c62053ebf690f0ae57729d8bc448/lib/service.js) | `-c` → `--config`, `-o` → `--output-file`, `-f` → `--format`, `-h` → `--help`, `-v` → `--version` |
| [`fd`](https://github.com/sharkdp/fd/blob/master/src/cli.rs) | `-H` → `--hidden`, `-I` → `--no-ignore`, `-u` → `--unrestricted`, `-s` → `--case-sensitive`, `-i` → `--ignore-case`, `-g` → `--glob`, `-F` → `--fixed-strings`, `-a` → `--absolute-path`, `-l` → `--list-details`, `-L` → `--follow`, `-p` → `--full-path`, `-d` → `--max-depth`, `-E` → `--exclude`, `-t` → `--type`, `-e` → `--extension`, `-S` → `--size`, `-o` → `--owner`, `-c` → `--color`, `-j` → `--threads`, `-q` → `--quiet`, `-C` → `--base-directory`, `-x` → `--exec`, `-X` → `--exec-batch` |
| [`fdfind`](https://github.com/sharkdp/fd/blob/master/src/cli.rs) | `-H` → `--hidden`, `-I` → `--no-ignore`, `-u` → `--unrestricted`, `-s` → `--case-sensitive`, `-i` → `--ignore-case`, `-g` → `--glob`, `-F` → `--fixed-strings`, `-a` → `--absolute-path`, `-l` → `--list-details`, `-L` → `--follow`, `-p` → `--full-path`, `-d` → `--max-depth`, `-E` → `--exclude`, `-t` → `--type`, `-e` → `--extension`, `-S` → `--size`, `-o` → `--owner`, `-c` → `--color`, `-j` → `--threads`, `-q` → `--quiet`, `-C` → `--base-directory`, `-x` → `--exec`, `-X` → `--exec-batch` |
| [`firebase`](https://github.com/firebase/firebase-tools/blob/main/src/index.ts) | `-P` → `--project`, `-j` → `--json`, `-i` → `--interactive`, `-c` → `--config`, `-h` → `--help`, `-V` → `--version` |
| [`flake8`](https://github.com/PyCQA/flake8/blob/main/src/flake8/main/options.py) | `-v` → `--verbose`, `-q` → `--quiet`, `-j` → `--jobs` |
| [`git`](https://github.com/git/git/blob/master/git.c) | `-p` → `--paginate`, `-P` → `--no-pager`, `-h` → `--help`, `-v` → `--version` |
| [`grunt`](https://github.com/gruntjs/grunt-known-options/blob/main/index.js) | `-h` → `--help`, `-b` → `--base`, `-d` → `--debug`, `-f` → `--force`, `-v` → `--verbose`, `-V` → `--version`, `-p` → `--preload` |
| [`gulp`](https://github.com/gulpjs/gulp-cli/blob/main/lib/shared/options/cli-options.js) | `-h` → `--help`, `-v` → `--version`, `-f` → `--gulpfile`, `-T` → `--tasks`, `-S` → `--silent`, `-L` → `--log-level` |
| [`gunzip`](https://github.com/apple-oss-distributions/file_cmds/blob/main/gzip/gzip.c) | `-c` → `--stdout`, `-d` → `--decompress`, `-f` → `--force`, `-h` → `--help`, `-k` → `--keep`, `-l` → `--list`, `-n` → `--no-name`, `-N` → `--name`, `-q` → `--quiet`, `-r` → `--recursive`, `-S` → `--suffix`, `-t` → `--test`, `-v` → `--verbose`, `-V` → `--version` |
| [`gzip`](https://github.com/apple-oss-distributions/file_cmds/blob/main/gzip/gzip.c) | `-c` → `--stdout`, `-d` → `--decompress`, `-f` → `--force`, `-h` → `--help`, `-k` → `--keep`, `-l` → `--list`, `-n` → `--no-name`, `-N` → `--name`, `-q` → `--quiet`, `-r` → `--recursive`, `-S` → `--suffix`, `-t` → `--test`, `-v` → `--verbose`, `-V` → `--version` |
| [`hatch`](https://github.com/pypa/hatch/blob/master/src/hatch/cli/__init__.py) | `-e` → `--env`, `-p` → `--project`, `-v` → `--verbose`, `-q` → `--quiet`, `-h` → `--help` |
| [`html-minifier`](https://github.com/kangax/html-minifier/blob/gh-pages/cli.js) | `-o` → `--output`, `-c` → `--config-file` |
| [`html-minifier-terser`](https://github.com/terser/html-minifier-terser/blob/master/cli.js) | `-o` → `--output`, `-c` → `--config-file` |
| [`html-validate`](https://github.com/html-validate/html-validate/blob/master/src/cli/html-validate.ts) | `-c` → `--config`, `-f` → `--formatter`, `-h` → `--help`, `-p` → `--preset` |
| [`htmlhint`](https://github.com/htmlhint/HTMLHint/blob/main/src/cli/htmlhint.ts) | `-l` → `--list`, `-c` → `--config`, `-r` → `--rules`, `-R` → `--rulesdir`, `-f` → `--format`, `-i` → `--ignore`, `-h` → `--help`, `-V` → `--version` |
| [`hyperfine`](https://github.com/sharkdp/hyperfine/blob/master/src/cli.rs) | `-w` → `--warmup`, `-m` → `--min-runs`, `-M` → `--max-runs`, `-r` → `--runs`, `-s` → `--setup`, `-p` → `--prepare`, `-C` → `--conclude`, `-c` → `--cleanup`, `-P` → `--parameter-scan`, `-D` → `--parameter-step-size`, `-L` → `--parameter-list`, `-i` → `--ignore-failure`, `-n` → `--command-name` |
| [`isort`](https://github.com/PyCQA/isort/blob/main/isort/main.py) | `-h` → `--help`, `-V` → `--version`, `-v` → `--verbose`, `-q` → `--quiet`, `-d` → `--stdout`, `-c` → `--check-only`, `-j` → `--jobs`, `-s` → `--skip`, `-a` → `--add-import`, `-e` → `--balanced`, `-i` → `--indent`, `-m` → `--multi-line`, `-n` → `--ensure-newline-before-comments`, `-l` → `--line-length`, `-w` → `--line-length`, `-t` → `--top`, `-b` → `--builtin`, `-f` → `--future`, `-o` → `--thirdparty`, `-p` → `--project` |
| [`jest`](https://github.com/jestjs/jest/blob/v30.5.2/packages/jest-cli/src/args.ts) | `-b` → `--bail`, `-c` → `--config`, `-e` → `--expand`, `-w` → `--maxWorkers`, `-o` → `--onlyChanged`, `-f` → `--onlyFailures`, `-i` → `--runInBand`, `-t` → `--testNamePattern`, `-u` → `--updateSnapshot` |
| [`jq`](https://github.com/jqlang/jq/blob/master/src/main.c) | `-s` → `--slurp`, `-r` → `--raw-output`, `-j` → `--join-output`, `-c` → `--compact-output`, `-C` → `--color-output`, `-M` → `--monochrome-output`, `-a` → `--ascii-output`, `-S` → `--sort-keys`, `-R` → `--raw-input`, `-n` → `--null-input`, `-f` → `--from-file`, `-e` → `--exit-status`, `-h` → `--help`, `-V` → `--version` |
| [`jscpd`](https://github.com/kucherenko/jscpd/blob/master/rust/crates/cpd/src/cli.rs) | `-k` → `--min-tokens`, `-l` → `--min-lines`, `-x` → `--max-lines`, `-z` → `--max-size`, `-t` → `--threshold`, `-c` → `--config`, `-i` → `--ignore`, `-r` → `--reporters`, `-o` → `--output`, `-m` → `--mode`, `-f` → `--format`, `-p` → `--pattern`, `-b` → `--blame`, `-s` → `--silent`, `-a` → `--absolute` |
| [`jsdoc`](https://github.com/jsdoc/jsdoc/blob/main/packages/jsdoc-cli/lib/flags.js) | `-a` → `--access`, `-c` → `--configure`, `-d` → `--destination`, `-e` → `--encoding`, `-X` → `--explain`, `-h` → `--help`, `-P` → `--package`, `-p` → `--private`, `-q` → `--query`, `-R` → `--readme`, `-t` → `--template`, `-v` → `--version` |
| [`json5`](https://github.com/json5/json5/blob/main/lib/cli.js) | `-c` → `--convert`, `-s` → `--space`, `-v` → `--validate`, `-o` → `--out-file`, `-V` → `--version`, `-h` → `--help` |
| [`jsonlint`](https://github.com/zaach/jsonlint/blob/843cad2bbd87139bb75806c1c24fe0d821a41ff4/lib/cli.js) | `-v` → `--version`, `-s` → `--sort-keys`, `-i` → `--in-place`, `-t` → `--indent`, `-c` → `--compact`, `-V` → `--validate`, `-e` → `--environment`, `-q` → `--quiet`, `-p` → `--pretty-print` |
| [`just`](https://github.com/casey/just/blob/master/src/arguments.rs) | `-F` → `--dotenv-filename`, `-E` → `--dotenv-path`, `-n` → `--dry-run`, `-g` → `--global-justfile`, `-f` → `--justfile`, `-q` → `--quiet`, `-u` → `--unsorted`, `-v` → `--verbose`, `-d` → `--working-directory`, `-c` → `--command`, `-e` → `--edit`, `-l` → `--list`, `-s` → `--show` |
| [`knip`](https://github.com/webpro-nl/knip/blob/13d7f21e8ec5b30d8fe6d8377c9012b9db96f871/packages/knip/src/util/cli-arguments.ts) | `-c` → `--config`, `-d` → `--debug`, `-D` → `--directory`, `-f` → `--fix`, `-F` → `--format`, `-h` → `--help`, `-n` → `--no-progress`, `-p` → `--production`, `-u` → `--duration`, `-s` → `--strict`, `-t` → `--tsConfig`, `-V` → `--version`, `-w` → `--watch`, `-W` → `--workspace` |
| [`lessc`](https://github.com/less/less.js/blob/master/packages/less/bin/lessc) | `-s` → `--silent`, `-l` → `--lint`, `-x` → `--compress`, `-M` → `--depends` |
| [`lightningcss`](https://github.com/parcel-bundler/lightningcss/blob/master/src/main.rs) | `-o` → `--output-file`, `-d` → `--output-dir`, `-m` → `--minify`, `-t` → `--targets` |
| [`lint-staged`](https://github.com/lint-staged/lint-staged/blob/v17.6.0/lib/cli.js) | `-h` → `--help`, `-V` → `--version`, `-p` → `--concurrent`, `-c` → `--config`, `-d` → `--debug`, `-q` → `--quiet`, `-r` → `--relative`, `-v` → `--verbose` |
| [`lychee`](https://github.com/lycheeverse/lychee/blob/master/lychee-bin/src/config/mod.rs) | `-c` → `--config`, `-n` → `--no-progress`, `-m` → `--max-redirects`, `-T` → `--threads`, `-u` → `--user-agent`, `-i` → `--insecure`, `-s` → `--scheme`, `-E` → `--exclude-all-private`, `-a` → `--accept`, `-t` → `--timeout`, `-r` → `--retry-wait-time`, `-X` → `--method`, `-o` → `--output`, `-f` → `--format`, `-v` → `--verbose`, `-q` → `--quiet`, `-V` → `--version` |
| [`lz4`](https://github.com/lz4/lz4/blob/dev/programs/lz4cli.c) | `-z` → `--compress`, `-d` → `--decompress`, `-t` → `--test`, `-m` → `--multiple`, `-v` → `--verbose`, `-q` → `--quiet`, `-k` → `--keep`, `-h` → `--help`, `-V` → `--version` |
| [`madge`](https://github.com/pahen/madge/blob/master/bin/cli.js) | `-b` → `--basedir`, `-s` → `--summary`, `-c` → `--circular`, `-d` → `--depends`, `-x` → `--exclude`, `-j` → `--json`, `-i` → `--image`, `-l` → `--layout`, `-h` → `--help`, `-V` → `--version` |
| [`markdown-it`](https://github.com/markdown-it/markdown-it/blob/master/bin/markdown-it.mjs) | `-v` → `--version`, `-l` → `--linkify`, `-t` → `--typographer`, `-o` → `--output` |
| [`markdownlint`](https://github.com/igorshubovych/markdownlint-cli/blob/v0.49.1/markdownlint.js) | `-c` → `--config`, `-d` → `--dot`, `-f` → `--fix`, `-i` → `--ignore`, `-j` → `--json`, `-o` → `--output`, `-p` → `--ignore-path`, `-q` → `--quiet`, `-r` → `--rules`, `-s` → `--stdin` |
| [`marked`](https://github.com/markedjs/marked/blob/master/bin/main.js) | `-o` → `--output`, `-i` → `--input`, `-s` → `--string`, `-t` → `--tokens`, `-c` → `--config`, `-n` → `--no-clobber`, `-h` → `--help`, `-v` → `--version` |
| [`mkdirp`](https://github.com/isaacs/node-mkdirp/blob/main/src/bin.ts) | `-p` → `--print`, `-h` → `--help`, `-v` → `--version` |
| [`mkdocs`](https://github.com/mkdocs/mkdocs/blob/master/mkdocs/__main__.py) | `-v` → `--verbose`, `-q` → `--quiet`, `-h` → `--help`, `-V` → `--version` |
| [`mocha`](https://github.com/mochajs/mocha/blob/v12.0.3/lib/cli/run-option-metadata.cjs) | `-A` → `--async-only`, `-b` → `--bail`, `-c` → `--color`, `-C` → `--no-colors`, `-f` → `--fgrep`, `-g` → `--grep`, `-i` → `--invert`, `-j` → `--jobs`, `-n` → `--node-option`, `-p` → `--parallel`, `-R` → `--reporter`, `-O` → `--reporter-option`, `-r` → `--require`, `-s` → `--slow`, `-S` → `--sort`, `-t` → `--timeout`, `-u` → `--ui`, `-w` → `--watch` |
| [`mypy`](https://github.com/python/mypy/blob/master/mypy/main.py) | `-h` → `--help`, `-v` → `--verbose`, `-V` → `--version`, `-O` → `--output`, `-i` → `--incremental`, `-m` → `--module`, `-p` → `--package`, `-c` → `--command` |
| [`ncc`](https://github.com/vercel/ncc/blob/main/src/cli.js) | `-h` → `--help`, `-v` → `--version`, `-a` → `--asset-builds`, `-d` → `--debug`, `-e` → `--external`, `-o` → `--out`, `-m` → `--minify`, `-s` → `--source-map`, `-C` → `--no-cache`, `-q` → `--quiet`, `-w` → `--watch`, `-t` → `--transpile-only` |
| [`ncu`](https://github.com/raineorshine/npm-check-updates/blob/main/src/cli-options.ts) | `-d` → `--doctor`, `-e` → `--errorLevel`, `-g` → `--global`, `-h` → `--help`, `-i` → `--interactive`, `-j` → `--jsonAll`, `-l` → `--loglevel`, `-m` → `--minimal`, `-p` → `--packageManager`, `-r` → `--registry`, `-s` → `--silent`, `-t` → `--target`, `-u` → `--upgrade`, `-v` → `--version`, `-V` → `--version` |
| [`nexe`](https://github.com/nexe/nexe/blob/master/src/options.ts) | `-i` → `--input`, `-o` → `--output`, `-v` → `--version`, `-t` → `--target`, `-b` → `--build`, `-n` → `--name`, `-r` → `--resource`, `-p` → `--python`, `-f` → `--flag`, `-c` → `--configure`, `-m` → `--make`, `-h` → `--help`, `-l` → `--loglevel` |
| [`next`](https://github.com/vercel/next.js/blob/canary/packages/next/src/bin/next.ts) | `-p` → `--port`, `-H` → `--hostname`, `-h` → `--help`, `-v` → `--version` |
| [`ninja`](https://github.com/ninja-build/ninja/blob/master/src/ninja.cc) | `-v` → `--verbose`, `-h` → `--help` |
| [`node`](https://github.com/nodejs/node/blob/main/src/node_options.cc) | `-c` → `--check`, `-e` → `--eval`, `-p` → `--print`, `-r` → `--require`, `-i` → `--interactive`, `-C` → `--conditions`, `-h` → `--help`, `-v` → `--version` |
| [`node-dev`](https://github.com/fgnass/node-dev/blob/master/lib/cli.js) | `-r` → `--require` |
| [`nodemon`](https://github.com/remy/nodemon/blob/main/lib/cli/parse.js) | `-V` → `--verbose`, `-L` → `--legacy-watch`, `-q` → `--quiet`, `-I` → `--no-stdin`, `-C` → `--on-change-only`, `-P` → `--polling-interval`, `-w` → `--watch`, `-i` → `--ignore`, `-d` → `--delay`, `-x` → `--exec`, `-e` → `--ext`, `-s` → `--signal` |
| [`npm`](https://github.com/npm/cli/blob/latest/workspaces/config/lib/definitions/definitions.js) | `-a` → `--all`, `-c` → `--call`, `-f` → `--force`, `-g` → `--global`, `-L` → `--location`, `-l` → `--long`, `-m` → `--message`, `-p` → `--parseable`, `-C` → `--prefix`, `-S` → `--save`, `-B` → `--save-bundle`, `-D` → `--save-dev`, `-E` → `--save-exact`, `-O` → `--save-optional`, `-P` → `--save-prod`, `-h` → `--usage`, `-H` → `--usage`, `-v` → `--version`, `-w` → `--workspace`, `-y` → `--yes` |
| [`npm-check-updates`](https://github.com/raineorshine/npm-check-updates/blob/main/src/cli-options.ts) | `-d` → `--doctor`, `-e` → `--errorLevel`, `-g` → `--global`, `-h` → `--help`, `-i` → `--interactive`, `-j` → `--jsonAll`, `-l` → `--loglevel`, `-m` → `--minimal`, `-p` → `--packageManager`, `-r` → `--registry`, `-s` → `--silent`, `-t` → `--target`, `-u` → `--upgrade`, `-v` → `--version`, `-V` → `--version` |
| [`npm-run-all`](https://github.com/bcomnes/npm-run-all2/blob/master/bin/common/parse-cli-args.js) | `-c` → `--continue-on-error`, `-l` → `--print-label`, `-n` → `--print-name`, `-r` → `--race`, `-p` → `--parallel`, `-s` → `--sequential` |
| [`npm-run-all2`](https://github.com/bcomnes/npm-run-all2/blob/master/bin/common/parse-cli-args.js) | `-c` → `--continue-on-error`, `-l` → `--print-label`, `-n` → `--print-name`, `-r` → `--race`, `-p` → `--parallel`, `-s` → `--sequential` |
| [`npmPkgJsonLint`](https://github.com/tclindner/npm-package-json-lint/blob/ff6be21e1346a0916a7c668f13470f4a9f5f71cf/src/cli.ts) | `-q` → `--quiet`, `-c` → `--config-file`, `-i` → `--ignore-path` |
| [`npx`](https://github.com/npm/cli/blob/latest/bin/npx-cli.js) | `-a` → `--all`, `-c` → `--call`, `-f` → `--force`, `-g` → `--global`, `-L` → `--location`, `-l` → `--long`, `-m` → `--message`, `-p` → `--package`, `-C` → `--prefix`, `-S` → `--save`, `-B` → `--save-bundle`, `-D` → `--save-dev`, `-E` → `--save-exact`, `-O` → `--save-optional`, `-P` → `--save-prod`, `-h` → `--usage`, `-H` → `--usage`, `-v` → `--version`, `-w` → `--workspace`, `-y` → `--yes` |
| [`nyc`](https://github.com/istanbuljs/schema/blob/v0.1.3/index.js) | `-t` → `--temp-dir`, `-x` → `--exclude`, `-n` → `--include`, `-e` → `--extension`, `-r` → `--reporter`, `-s` → `--silent`, `-a` → `--all`, `-c` → `--cache`, `-i` → `--require` |
| [`onchange`](https://github.com/Qard/onchange/blob/master/src/bin.ts) | `-a` → `--add`, `-c` → `--cwd`, `-d` → `--delay`, `-e` → `--exclude`, `-f` → `--filter`, `-h` → `--help`, `-i` → `--initial`, `-j` → `--jobs`, `-k` → `--kill`, `-o` → `--outpipe`, `-p` → `--poll`, `-v` → `--verbose` |
| [`oxfmt`](https://github.com/oxc-project/oxc/blob/b6eb91428366bf08bc4a7cc4875058426a27c098/apps/oxfmt/src/cli/command.rs) | `-c` → `--config` |
| [`oxlint`](https://github.com/oxc-project/oxc/blob/b6eb91428366bf08bc4a7cc4875058426a27c098/apps/oxlint/src/command/lint.rs) | `-c` → `--config`, `-A` → `--allow`, `-W` → `--warn`, `-D` → `--deny`, `-f` → `--format` |
| [`pa11y`](https://github.com/pa11y/pa11y/blob/main/bin/pa11y.js) | `-n` → `--environment`, `-s` → `--standard`, `-r` → `--reporter`, `-e` → `--runner`, `-l` → `--level`, `-T` → `--threshold`, `-i` → `--ignore`, `-R` → `--root-element`, `-E` → `--hide-elements`, `-c` → `--config`, `-t` → `--timeout`, `-w` → `--wait`, `-d` → `--debug`, `-S` → `--screen-capture`, `-A` → `--add-rule`, `-h` → `--help`, `-V` → `--version` |
| [`pandoc`](https://github.com/jgm/pandoc/blob/main/src/Text/Pandoc/App/CommandLineOptions.hs) | `-f` → `--from`, `-r` → `--from`, `-t` → `--to`, `-w` → `--to`, `-o` → `--output`, `-M` → `--metadata`, `-d` → `--defaults`, `-s` → `--standalone`, `-V` → `--variable`, `-N` → `--number-sections`, `-H` → `--include-in-header`, `-B` → `--include-before-body`, `-A` → `--include-after-body`, `-p` → `--preserve-tabs`, `-F` → `--filter`, `-L` → `--lua-filter`, `-i` → `--incremental`, `-T` → `--title-prefix`, `-c` → `--css`, `-D` → `--print-default-template`, `-C` → `--citeproc`, `-v` → `--version`, `-h` → `--help` |
| [`pdm`](https://github.com/pdm-project/pdm/blob/main/src/pdm/core.py) | `-c` → `--config`, `-v` → `--verbose`, `-q` → `--quiet`, `-I` → `--ignore-python`, `-V` → `--version`, `-h` → `--help` |
| [`pip`](https://github.com/pypa/pip/blob/main/src/pip/_internal/cli/cmdoptions.py) | `-v` → `--verbose`, `-q` → `--quiet`, `-h` → `--help`, `-V` → `--version` |
| [`pip3`](https://github.com/pypa/pip/blob/main/src/pip/_internal/cli/cmdoptions.py) | `-v` → `--verbose`, `-q` → `--quiet`, `-h` → `--help`, `-V` → `--version` |
| [`pnpm`](https://github.com/pnpm/pnpm/blob/main/pnpm/crates/cli/src/cli_args/cli_command.rs) | `-r` → `--recursive`, `-C` → `--dir`, `-w` → `--workspace-root`, `-F` → `--filter`, `-y` → `--yes`, `-h` → `--help`, `-v` → `--version` |
| [`poetry`](https://github.com/python-poetry/poetry/blob/main/src/poetry/console/application.py) | `-P` → `--project`, `-C` → `--directory`, `-h` → `--help`, `-q` → `--quiet`, `-v` → `--verbose`, `-V` → `--version`, `-n` → `--no-interaction` |
| [`postcss`](https://github.com/postcss/postcss-cli/blob/master/lib/args.js) | `-r` → `--replace`, `-w` → `--watch`, `-o` → `--output`, `-d` → `--dir`, `-m` → `--map`, `-u` → `--use` |
| [`prettier`](https://github.com/prettier/prettier/blob/main/src/cli/cli-options.evaluate.js) | `-c` → `--check`, `-l` → `--list-different`, `-w` → `--write`, `-u` → `--ignore-unknown`, `-v` → `--version`, `-h` → `--help` |
| [`prettier-eslint`](https://github.com/prettier/prettier-eslint-cli/blob/9167781098e8cb484b60e70516c78791924c569c/src/parser.ts) | `-h` → `--help`, `-l` → `--log-level` |
| [`prettier-package-json`](https://github.com/cameronhunter/prettier-package-json/blob/cd4b5916758ec8f7a3300060d2847f27379c7b72/bin/prettier-package-json) | `-l` → `--list-different` |
| [`pug`](https://github.com/pugjs/pug-cli/blob/master/index.js) | `-O` → `--obj`, `-o` → `--out`, `-p` → `--path`, `-b` → `--basedir`, `-P` → `--pretty`, `-c` → `--client`, `-n` → `--name`, `-D` → `--no-debug`, `-w` → `--watch`, `-E` → `--extension`, `-s` → `--silent` |
| [`pug-cli`](https://github.com/pugjs/pug-cli/blob/master/index.js) | `-O` → `--obj`, `-o` → `--out`, `-p` → `--path`, `-b` → `--basedir`, `-P` → `--pretty`, `-c` → `--client`, `-n` → `--name`, `-D` → `--no-debug`, `-w` → `--watch`, `-E` → `--extension`, `-s` → `--silent` |
| [`pug-lint`](https://github.com/pugjs/pug-lint/blob/master/lib/cli.js) | `-c` → `--config`, `-r` → `--reporter` |
| [`py.test`](https://github.com/pytest-dev/pytest/blob/main/src/_pytest/terminal.py), [main options](https://github.com/pytest-dev/pytest/blob/main/src/_pytest/main.py) | `-x` → `--exitfirst`, `-W` → `--pythonwarnings`, `-v` → `--verbose`, `-q` → `--quiet`, `-l` → `--showlocals`, `-c` → `--config-file` |
| [`pylint`](https://github.com/pylint-dev/pylint/blob/main/pylint/lint/base_options.py) | `-f` → `--output-format`, `-r` → `--reports`, `-s` → `--score`, `-e` → `--enable`, `-d` → `--disable`, `-j` → `--jobs`, `-E` → `--errors-only`, `-v` → `--verbose` |
| [`pyright`](https://github.com/microsoft/pyright/blob/main/packages/pyright-internal/src/pyright.ts) | `-h` → `--help`, `-p` → `--project`, `-t` → `--typeshedpath`, `-v` → `--venvpath`, `-w` → `--watch` |
| [`pytest`](https://github.com/pytest-dev/pytest/blob/main/src/_pytest/terminal.py), [main options](https://github.com/pytest-dev/pytest/blob/main/src/_pytest/main.py) | `-x` → `--exitfirst`, `-W` → `--pythonwarnings`, `-v` → `--verbose`, `-q` → `--quiet`, `-l` → `--showlocals`, `-c` → `--config-file` |
| [`qunit`](https://github.com/qunitjs/qunit/blob/main/bin/qunit.js) | `-f` → `--filter`, `-m` → `--module`, `-r` → `--reporter`, `-w` → `--watch`, `-h` → `--help`, `-V` → `--version` |
| [`rehype`](https://github.com/unifiedjs/unified-args/blob/main/lib/schema.js) | `-e` → `--ext`, `-f` → `--frail`, `-h` → `--help`, `-i` → `--ignore-path`, `-o` → `--output`, `-q` → `--quiet`, `-r` → `--rc-path`, `-s` → `--setting`, `-S` → `--silent`, `-t` → `--tree`, `-u` → `--use`, `-v` → `--version`, `-w` → `--watch` |
| [`release-it`](https://github.com/release-it/release-it/blob/main/lib/args.js) | `-c` → `--config`, `-d` → `--dry-run`, `-h` → `--help`, `-i` → `--increment`, `-v` → `--version`, `-V` → `--verbose` |
| [`remark`](https://github.com/unifiedjs/unified-args/blob/main/lib/schema.js) | `-e` → `--ext`, `-f` → `--frail`, `-h` → `--help`, `-i` → `--ignore-path`, `-o` → `--output`, `-q` → `--quiet`, `-r` → `--rc-path`, `-s` → `--setting`, `-S` → `--silent`, `-t` → `--tree`, `-u` → `--use`, `-v` → `--version`, `-w` → `--watch` |
| [`rg`](https://github.com/BurntSushi/ripgrep/blob/master/crates/core/flags/defs.rs) | `-A` → `--after-context`, `-B` → `--before-context`, `-b` → `--byte-offset`, `-s` → `--case-sensitive`, `-C` → `--context`, `-c` → `--count`, `-E` → `--encoding`, `-f` → `--file`, `-l` → `--files-with-matches`, `-F` → `--fixed-strings`, `-L` → `--follow`, `-g` → `--glob`, `-i` → `--ignore-case`, `-v` → `--invert-match`, `-n` → `--line-number`, `-N` → `--no-line-number`, `-x` → `--line-regexp`, `-M` → `--max-columns`, `-m` → `--max-count`, `-d` → `--max-depth`, `-U` → `--multiline`, `-o` → `--only-matching`, `-P` → `--pcre2`, `-p` → `--pretty`, `-q` → `--quiet`, `-e` → `--regexp`, `-r` → `--replace`, `-z` → `--search-zip`, `-S` → `--smart-case`, `-a` → `--text`, `-j` → `--threads`, `-t` → `--type`, `-T` → `--type-not`, `-u` → `--unrestricted`, `-H` → `--with-filename`, `-I` → `--no-filename`, `-w` → `--word-regexp` |
| [`rimraf`](https://github.com/isaacs/rimraf/blob/main/src/bin.mts) | `-g` → `--glob`, `-G` → `--no-glob`, `-v` → `--verbose`, `-V` → `--no-verbose`, `-i` → `--interactive`, `-I` → `--no-interactive` |
| [`rollup`](https://github.com/rollup/rollup/blob/master/src/utils/options/mergeOptions.ts) | `-c` → `--config`, `-d` → `--dir`, `-e` → `--external`, `-f` → `--format`, `-g` → `--globals`, `-i` → `--input`, `-m` → `--sourcemap`, `-n` → `--name`, `-o` → `--file`, `-p` → `--plugin`, `-w` → `--watch` |
| [`rsync`](https://github.com/RsyncProject/rsync/blob/master/options.c) | `-a` → `--archive`, `-b` → `--backup`, `-c` → `--checksum`, `-d` → `--dirs`, `-r` → `--recursive`, `-R` → `--relative`, `-l` → `--links`, `-L` → `--copy-links`, `-k` → `--copy-dirlinks`, `-K` → `--keep-dirlinks`, `-p` → `--perms`, `-t` → `--times`, `-g` → `--group`, `-o` → `--owner`, `-H` → `--hard-links`, `-S` → `--sparse`, `-n` → `--dry-run`, `-u` → `--update`, `-I` → `--ignore-times`, `-W` → `--whole-file`, `-x` → `--one-file-system`, `-C` → `--cvs-exclude`, `-z` → `--compress`, `-v` → `--verbose`, `-q` → `--quiet`, `-B` → `--block-size`, `-e` → `--rsh`, `-f` → `--filter`, `-T` → `--temp-dir` |
| [`ruff`](https://github.com/astral-sh/ruff/blob/main/crates/ruff/src/args.rs) | `-v` → `--verbose`, `-q` → `--quiet`, `-s` → `--silent` |
| [`run-p`](https://github.com/bcomnes/npm-run-all2/blob/master/bin/common/parse-cli-args.js) | `-c` → `--continue-on-error`, `-l` → `--print-label`, `-n` → `--print-name`, `-r` → `--race`, `-s` → `--silent` |
| [`run-s`](https://github.com/bcomnes/npm-run-all2/blob/master/bin/common/parse-cli-args.js) | `-c` → `--continue-on-error`, `-l` → `--print-label`, `-n` → `--print-name`, `-s` → `--silent` |
| [`rush`](https://github.com/microsoft/rushstack/blob/main/libraries/rush-lib/src/cli/RushCommandLineParser.ts) | `-d` → `--debug`, `-q` → `--quiet` |
| [`rustc`](https://github.com/rust-lang/rust/blob/main/compiler/rustc_session/src/config.rs) | `-h` → `--help`, `-A` → `--allow`, `-W` → `--warn`, `-D` → `--deny`, `-F` → `--forbid`, `-C` → `--codegen`, `-V` → `--version`, `-v` → `--verbose` |
| [`rustfmt`](https://github.com/rust-lang/rustfmt/blob/main/src/bin/main.rs) | `-l` → `--files-with-diff`, `-v` → `--verbose`, `-q` → `--quiet`, `-V` → `--version`, `-h` → `--help` |
| [`sass`](https://github.com/sass/dart-sass/blob/main/lib/src/executable/options.dart) | `-q` → `--quiet`, `-w` → `--watch`, `-c` → `--color`, `-I` → `--load-path`, `-p` → `--pkg-importer`, `-s` → `--style`, `-i` → `--interactive` |
| [`sass-lint`](https://github.com/sasstools/sass-lint/blob/master/bin/sass-lint.js) | `-c` → `--config`, `-i` → `--ignore`, `-q` → `--no-exit`, `-v` → `--verbose`, `-f` → `--format`, `-o` → `--output`, `-s` → `--syntax` |
| [`semver`](https://github.com/npm/node-semver/blob/main/bin/semver.js) | `-l` → `--loose`, `-p` → `--include-prerelease`, `-v` → `--version`, `-i` → `--increment`, `-r` → `--range`, `-c` → `--coerce`, `-h` → `--help` |
| [`serve`](https://github.com/vercel/serve/blob/main/source/utilities/cli.ts) | `-s` → `--single`, `-d` → `--debug`, `-L` → `--no-request-logging`, `-C` → `--cors`, `-n` → `--no-clipboard`, `-u` → `--no-compression`, `-S` → `--symlinks`, `-l` → `--listen`, `-c` → `--config` |
| [`shellcheck`](https://github.com/koalaman/shellcheck/blob/master/shellcheck.hs) | `-a` → `--check-sourced`, `-C` → `--color`, `-i` → `--include`, `-e` → `--exclude`, `-f` → `--format`, `-o` → `--enable`, `-P` → `--source-path`, `-s` → `--shell`, `-S` → `--severity`, `-V` → `--version`, `-W` → `--wiki-link-count`, `-x` → `--external-sources` |
| [`shfmt`](https://github.com/mvdan/sh/blob/master/cmd/shfmt/main.go) | `-l` → `--list`, `-w` → `--write`, `-d` → `--diff`, `-p` → `--posix`, `-s` → `--simplify`, `-i` → `--indent`, `-f` → `--find` |
| [`sort-package-json`](https://github.com/keithamus/sort-package-json/blob/main/cli.js) | `-c` → `--check`, `-q` → `--quiet`, `-i` → `--ignore`, `-v` → `--version`, `-h` → `--help` |
| [`sphinx-build`](https://github.com/sphinx-doc/sphinx/blob/master/sphinx/cmd/build.py) | `-b` → `--builder`, `-j` → `--jobs`, `-a` → `--write-all`, `-E` → `--fresh-env`, `-d` → `--doctree-dir`, `-c` → `--conf-dir`, `-C` → `--isolated`, `-D` → `--define`, `-A` → `--html-define`, `-t` → `--tag`, `-n` → `--nitpicky`, `-v` → `--verbose`, `-q` → `--quiet`, `-Q` → `--silent`, `-N` → `--no-color`, `-w` → `--warning-file`, `-W` → `--fail-on-warning`, `-T` → `--show-traceback`, `-P` → `--pdb`, `-h` → `--help` |
| [`standard-changelog`](https://github.com/conventional-changelog/conventional-changelog/blob/master/packages/conventional-changelog/src/cli/cli.ts) | `-i` → `--infile`, `-o` → `--outfile`, `-p` → `--preset`, `-k` → `--pkg`, `-a` → `--append`, `-r` → `--release-count`, `-u` → `--output-unreleased`, `-v` → `--verbose`, `-n` → `--config`, `-c` → `--context`, `-l` → `--lerna-package`, `-t` → `--tag-prefix`, `-f` → `--first-release` |
| [`standard-version`](https://github.com/conventional-changelog/standard-version/blob/master/command.js) | `-r` → `--release-as`, `-p` → `--prerelease`, `-i` → `--infile`, `-m` → `--message`, `-f` → `--first-release`, `-s` → `--sign`, `-a` → `--commit-all`, `-t` → `--tag-prefix`, `-v` → `--version`, `-h` → `--help` |
| [`stylelint`](https://github.com/stylelint/stylelint/blob/17.16.0/lib/cli.mjs) | `-c` → `--config`, `-f` → `--formatter`, `-h` → `--help`, `-i` → `--ignore-path`, `-o` → `--output-file`, `-q` → `--quiet`, `-v` → `--version` |
| [`stylus`](https://github.com/stylus/stylus/blob/dev/bin/stylus) | `-h` → `--help`, `-d` → `--compare`, `-c` → `--compress`, `-C` → `--css`, `-f` → `--firebug`, `-l` → `--line-numbers`, `-m` → `--sourcemap`, `-q` → `--quiet`, `-P` → `--prefix`, `-p` → `--print`, `-V` → `--version`, `-o` → `--out`, `-i` → `--interactive`, `-I` → `--include`, `-w` → `--watch`, `-U` → `--inline`, `-u` → `--use`, `-r` → `--resolve-url`, `-D` → `--deps` |
| [`sucrase`](https://github.com/alangpierce/sucrase/blob/main/src/cli.ts) | `-d` → `--out-dir`, `-p` → `--project`, `-q` → `--quiet`, `-t` → `--transforms` |
| [`svgo`](https://github.com/svg/svgo/blob/main/lib/svgo/coa.js) | `-v` → `--version`, `-i` → `--input`, `-s` → `--string`, `-f` → `--folder`, `-o` → `--output`, `-p` → `--precision`, `-r` → `--recursive`, `-q` → `--quiet` |
| [`swc`](https://github.com/swc-project/pkgs/blob/main/packages/cli/src/swc/options.ts) | `-w` → `--watch`, `-q` → `--quiet`, `-D` → `--copy-files`, `-f` → `--filename`, `-s` → `--source-maps`, `-o` → `--out-file`, `-d` → `--out-dir`, `-C` → `--config` |
| [`tap`](https://github.com/tapjs/tapjs/blob/tap%4021.8.0/src/config/src/jack.ts) | `-R` → `--reporter`, `-f` → `--reporter-file`, `-r` → `--reporter-arg`, `-c` → `--color`, `-C` → `--no-color`, `-b` → `--bail`, `-B` → `--no-bail`, `-t` → `--timeout`, `-n` → `--changed`, `-s` → `--save`, `-j` → `--jobs`, `-o` → `--output-file`, `-d` → `--output-dir` |
| [`tape`](https://github.com/tape-testing/tape/blob/master/bin/tape) | `-r` → `--require`, `-i` → `--ignore` |
| [`terser`](https://github.com/terser/terser/blob/master/lib/cli.js) | `-p` → `--parse`, `-c` → `--compress`, `-m` → `--mangle`, `-f` → `--format`, `-b` → `--beautify`, `-o` → `--output`, `-d` → `--define`, `-e` → `--enclose` |
| [`testcafe`](https://github.com/DevExpress/testcafe/blob/master/src/cli/argument-parser/index.ts) | `-b` → `--list-browsers`, `-r` → `--reporter`, `-s` → `--screenshots`, `-S` → `--screenshots-on-fails`, `-p` → `--screenshot-path-pattern`, `-q` → `--quarantine-mode`, `-d` → `--debug-mode`, `-e` → `--skip-js-errors`, `-u` → `--skip-uncaught-errors`, `-t` → `--test`, `-T` → `--test-grep`, `-f` → `--fixture`, `-F` → `--fixture-grep`, `-a` → `--app`, `-c` → `--concurrency`, `-L` → `--live`, `-v` → `--version`, `-h` → `--help` |
| [`textlint`](https://github.com/textlint/textlint/blob/master/packages/textlint/src/options.ts) | `-h` → `--help`, `-c` → `--config`, `-v` → `--version`, `-o` → `--output-file`, `-f` → `--format` |
| [`ts-node`](https://github.com/TypeStrong/ts-node/blob/main/src/bin.ts) | `-e` → `--eval`, `-i` → `--interactive`, `-p` → `--print`, `-r` → `--require`, `-h` → `--help`, `-s` → `--script-mode`, `-v` → `--version`, `-T` → `--transpileOnly`, `-H` → `--compilerHost`, `-I` → `--ignore`, `-P` → `--project`, `-C` → `--compiler`, `-D` → `--ignoreDiagnostics`, `-O` → `--compilerOptions` |
| [`ts-node-esm`](https://github.com/TypeStrong/ts-node/blob/main/src/bin-esm.ts) | `-e` → `--eval`, `-i` → `--interactive`, `-p` → `--print`, `-r` → `--require`, `-h` → `--help`, `-s` → `--script-mode`, `-v` → `--version`, `-T` → `--transpileOnly`, `-H` → `--compilerHost`, `-I` → `--ignore`, `-P` → `--project`, `-C` → `--compiler`, `-D` → `--ignoreDiagnostics`, `-O` → `--compilerOptions` |
| [`ts-node-transpile-only`](https://github.com/TypeStrong/ts-node/blob/main/src/bin-transpile.ts) | `-e` → `--eval`, `-i` → `--interactive`, `-p` → `--print`, `-r` → `--require`, `-h` → `--help`, `-s` → `--script-mode`, `-v` → `--version`, `-T` → `--transpileOnly`, `-H` → `--compilerHost`, `-I` → `--ignore`, `-P` → `--project`, `-C` → `--compiler`, `-D` → `--ignoreDiagnostics`, `-O` → `--compilerOptions` |
| [`tsc`](https://github.com/microsoft/TypeScript/blob/v5.9.3/src/compiler/commandLineParser.ts) | `-b` → `--build`, `-w` → `--watch`, `-h` → `--help`, `-p` → `--project`, `-t` → `--target`, `-m` → `--module`, `-i` → `--incremental` |
| [`tsc-alias`](https://github.com/justkey007/tsc-alias/blob/master/src/bin/index.ts) | `-w` → `--watch`, `-f` → `--resolve-full-paths`, `-v` → `--verbose`, `-p` → `--project`, `-r` → `--replacer` |
| [`tsgo`](https://github.com/microsoft/typescript-go/blob/main/internal/tsoptions/declscompiler.go) | `-b` → `--build`, `-h` → `--help`, `-w` → `--watch`, `-i` → `--incremental`, `-q` → `--quiet`, `-p` → `--project`, `-t` → `--target`, `-m` → `--module` |
| [`tsup`](https://github.com/egoist/tsup/blob/main/src/cli-main.ts) | `-d` → `--out-dir` |
| [`tsx`](https://github.com/privatenumber/tsx/blob/master/src/cli.ts) | `-e` → `--eval`, `-p` → `--print` |
| [`turbo`](https://github.com/vercel/turborepo/blob/main/crates/turborepo-cli/src/cli/args.rs) | `-F` → `--filter`, `-h` → `--help` |
| [`uglifyjs`](https://github.com/mishoo/UglifyJS/blob/master/bin/uglifyjs) | `-b` → `--beautify`, `-c` → `--compress`, `-d` → `--define`, `-e` → `--enclose`, `-h` → `--help`, `-m` → `--mangle`, `-o` → `--output`, `-O` → `--output-opts`, `-p` → `--parse`, `-v` → `--version`, `-V` → `--version` |
| [`unxz`](https://github.com/tukaani-project/xz/blob/master/src/xz/args.c) | `-z` → `--compress`, `-d` → `--decompress`, `-t` → `--test`, `-l` → `--list`, `-k` → `--keep`, `-f` → `--force`, `-c` → `--stdout`, `-S` → `--suffix`, `-F` → `--format`, `-C` → `--check`, `-M` → `--memlimit`, `-T` → `--threads`, `-e` → `--extreme`, `-q` → `--quiet`, `-v` → `--verbose`, `-Q` → `--no-warn`, `-h` → `--help`, `-H` → `--long-help`, `-V` → `--version` |
| [`unzstd`](https://github.com/facebook/zstd/blob/dev/programs/zstdcli.c) | `-z` → `--compress`, `-f` → `--force`, `-v` → `--verbose`, `-q` → `--quiet`, `-k` → `--keep`, `-C` → `--check`, `-t` → `--test`, `-l` → `--list`, `-V` → `--version`, `-H` → `--help` |
| [`uv`](https://github.com/astral-sh/uv/blob/main/crates/uv-cli/src/lib.rs) | `-q` → `--quiet`, `-v` → `--verbose`, `-V` → `--version` |
| [`vc`](https://github.com/vercel/vercel/blob/main/packages/cli/src/util/arg-common.ts) | `-A` → `--local-config`, `-Q` → `--global-config`, `-S` → `--scope`, `-T` → `--team`, `-h` → `--help` |
| [`vercel`](https://github.com/vercel/vercel/blob/main/packages/cli/src/util/arg-common.ts) | `-A` → `--local-config`, `-Q` → `--global-config`, `-S` → `--scope`, `-T` → `--team`, `-h` → `--help` |
| [`vite`](https://github.com/vitejs/vite/blob/main/packages/vite/src/node/cli.ts) | `-c` → `--config`, `-l` → `--logLevel`, `-d` → `--debug`, `-f` → `--filter`, `-m` → `--mode` |
| [`vitest`](https://github.com/vitest-dev/vitest/blob/v5.0.3/packages/vitest/src/node/cli/cli-config.ts) | `-r` → `--root`, `-c` → `--config`, `-u` → `--update`, `-w` → `--watch`, `-t` → `--testNamePattern`, `-p` → `--project` |
| [`vue-tsc`](https://github.com/vuejs/language-tools/blob/master/packages/tsc/index.ts) | `-b` → `--build`, `-w` → `--watch`, `-h` → `--help`, `-p` → `--project`, `-t` → `--target`, `-m` → `--module`, `-i` → `--incremental` |
| [`wait-on`](https://github.com/jeffbski/wait-on/blob/master/bin/wait-on) | `-c` → `--config`, `-d` → `--delay`, `-i` → `--interval`, `-l` → `--log`, `-r` → `--reverse`, `-s` → `--simultaneous`, `-t` → `--timeout`, `-v` → `--verbose`, `-w` → `--window`, `-h` → `--help` |
| [`watchexec`](https://github.com/watchexec/watchexec/tree/main/crates/cli/src/args) | `-E` → `--env`, `-o` → `--on-busy-update`, `-r` → `--restart`, `-s` → `--signal`, `-d` → `--debounce`, `-I` → `--interactive`, `-p` → `--postpone`, `-w` → `--watch`, `-W` → `--watch-non-recursive`, `-F` → `--watch-file`, `-e` → `--exts`, `-f` → `--filter`, `-j` → `--filter-prog`, `-i` → `--ignore`, `-v` → `--verbose`, `-c` → `--clear`, `-N` → `--notify`, `-q` → `--quiet` |
| [`watchify`](https://github.com/browserify/watchify/blob/master/bin/args.js) | `-d` → `--debug`, `-s` → `--standalone`, `-r` → `--require`, `-u` → `--exclude`, `-x` → `--external`, `-t` → `--transform`, `-i` → `--ignore`, `-o` → `--outfile`, `-e` → `--entry`, `-c` → `--command` |
| [`wds`](https://github.com/modernweb-dev/web/blob/master/packages/dev-server/src/config/readCliArgs.ts) | `-c` → `--config`, `-r` → `--root-dir`, `-b` → `--base-path`, `-o` → `--open`, `-a` → `--app-index`, `-w` → `--watch`, `-p` → `--port`, `-h` → `--hostname` |
| [`web-dev-server`](https://github.com/modernweb-dev/web/blob/master/packages/dev-server/src/config/readCliArgs.ts) | `-c` → `--config`, `-r` → `--root-dir`, `-b` → `--base-path`, `-o` → `--open`, `-a` → `--app-index`, `-w` → `--watch`, `-p` → `--port`, `-h` → `--hostname` |
| [`webpack`](https://github.com/webpack/webpack-cli/blob/main/OPTIONS.md) | `-m` → `--merge`, `-w` → `--watch`, `-c` → `--config`, `-j` → `--json`, `-o` → `--output-path`, `-t` → `--target` |
| [`webpack-bundle-analyzer`](https://github.com/webpack-contrib/webpack-bundle-analyzer/blob/main/src/bin/analyzer.js) | `-m` → `--mode`, `-p` → `--port`, `-r` → `--report`, `-t` → `--title`, `-s` → `--default-sizes`, `-O` → `--no-open`, `-e` → `--exclude`, `-l` → `--log-level` |
| [`webpack-cli`](https://github.com/webpack/webpack-cli/blob/main/OPTIONS.md) | `-m` → `--merge`, `-w` → `--watch`, `-c` → `--config`, `-j` → `--json`, `-o` → `--output-path`, `-t` → `--target` |
| [`webpack-dev-server`](https://github.com/webpack/webpack-cli/blob/main/packages/webpack-cli/src/webpack-cli.ts) | `-w` → `--watch`, `-c` → `--config`, `-j` → `--json`, `-t` → `--target` |
| [`wrangler`](https://github.com/cloudflare/workers-sdk/blob/main/packages/wrangler/src/index.ts) | `-c` → `--config`, `-e` → `--env`, `-h` → `--help` |
| [`wrangler2`](https://github.com/cloudflare/workers-sdk/blob/main/packages/wrangler/src/index.ts) | `-c` → `--config`, `-e` → `--env`, `-h` → `--help` |
| [`xz`](https://github.com/tukaani-project/xz/blob/master/src/xz/args.c) | `-z` → `--compress`, `-d` → `--decompress`, `-t` → `--test`, `-l` → `--list`, `-k` → `--keep`, `-f` → `--force`, `-c` → `--stdout`, `-S` → `--suffix`, `-F` → `--format`, `-C` → `--check`, `-M` → `--memlimit`, `-T` → `--threads`, `-e` → `--extreme`, `-q` → `--quiet`, `-v` → `--verbose`, `-Q` → `--no-warn`, `-h` → `--help`, `-H` → `--long-help`, `-V` → `--version` |
| [`xzcat`](https://github.com/tukaani-project/xz/blob/master/src/xz/args.c) | `-z` → `--compress`, `-d` → `--decompress`, `-t` → `--test`, `-l` → `--list`, `-k` → `--keep`, `-f` → `--force`, `-c` → `--stdout`, `-S` → `--suffix`, `-F` → `--format`, `-C` → `--check`, `-M` → `--memlimit`, `-T` → `--threads`, `-e` → `--extreme`, `-q` → `--quiet`, `-v` → `--verbose`, `-Q` → `--no-warn`, `-h` → `--help`, `-H` → `--long-help`, `-V` → `--version` |
| [`yamllint`](https://github.com/adrienverge/yamllint/blob/master/yamllint/cli.py) | `-c` → `--config-file`, `-d` → `--config-data`, `-f` → `--format`, `-s` → `--strict`, `-v` → `--version`, `-h` → `--help` |
| [`yapf`](https://github.com/google/yapf/blob/main/yapf/__init__.py) | `-v` → `--version`, `-d` → `--diff`, `-i` → `--in-place`, `-q` → `--quiet`, `-r` → `--recursive`, `-l` → `--lines`, `-e` → `--exclude`, `-p` → `--parallel`, `-m` → `--print-modified`, `-h` → `--help` |
| [`zcat`](https://github.com/apple-oss-distributions/file_cmds/blob/main/gzip/gzip.c) | `-c` → `--stdout`, `-d` → `--decompress`, `-f` → `--force`, `-h` → `--help`, `-k` → `--keep`, `-l` → `--list`, `-n` → `--no-name`, `-N` → `--name`, `-q` → `--quiet`, `-r` → `--recursive`, `-S` → `--suffix`, `-t` → `--test`, `-v` → `--verbose`, `-V` → `--version` |
| [`zstd`](https://github.com/facebook/zstd/blob/dev/programs/zstdcli.c) | `-z` → `--compress`, `-f` → `--force`, `-v` → `--verbose`, `-q` → `--quiet`, `-k` → `--keep`, `-C` → `--check`, `-t` → `--test`, `-l` → `--list`, `-V` → `--version`, `-H` → `--help` |
| [`zstdcat`](https://github.com/facebook/zstd/blob/dev/programs/zstdcli.c) | `-z` → `--compress`, `-f` → `--force`, `-v` → `--verbose`, `-q` → `--quiet`, `-k` → `--keep`, `-C` → `--check`, `-t` → `--test`, `-l` → `--list`, `-V` → `--version`, `-H` → `--help` |

Fixing continues through known options that do not consume a value and their exact long equivalents. An option that takes a value or optional argument is fixed, then fixing stops for that invocation. `tsc`, `vue-tsc`, and `tsgo` stop fixing after `-b` or `--build`, because build mode changes the meaning of other aliases. TypeScript's `-v` and `-d` are not fixed.

Untyped options that can consume the next word also stop fixing, including every supported Rollup alias. Execution mode switches such as `npm-run-all -p` and `sass -i` stop fixing too.

Mappings are command-specific and case-sensitive: Jest's `-w` means `--maxWorkers`, while AVA's means `--watch`; `npm-run-all -s` means `--sequential`, while `run-p -s` means `--silent`. Aliases with conflicting meanings, such as Bun's `-p` and webpack's `-d`, are reported without fixes. Tool versions are not resolved, so only verified aliases are included.

The `sphinx-build` aliases require Sphinx 7.3 or later, and Poetry's `-P` → `--project` requires Poetry 2.0 or later. Compression aliases are verified against the upstream implementations, including GNU and BSD gzip; rsync aliases use spellings shared by GNU rsync and openrsync.

`http-server`, `tailwindcss`, `dotenv`, `degit`, `sirv`, and `pkg` flags remain report-only because their parsers read some short and long names separately. Replacing a short name can change which value wins.

Some genuine parser aliases are also unsafe to replace: `ncu -f` and `-x` can accumulate configuration-file filters differently after rewriting, and `cspell -s` changes meaning in subcommands. Vercel's `-d`, `-t`, and `-v` have conflicting meanings across commands, and `jscpd -v` changed meaning between versions. `vite-node`, `dotenvx`, and `dx` remain report-only because they can forward the original CLI flags to another command.

Short and long help or version output can also differ: `deno -V`, `rg -h`, `rg -V`, `fd -h`, `fdfind -h`, and `watchexec -h` are not autofixed.

Some advertised aliases follow different parsing paths: `bzip2 -d`, `-z`, and `-t` can change precedence among mixed short and long flags; `zstd -d` and `-c` and LZ4's `-c` and `-f` can change additional state. Zstd's `-T` and `-M` read numeric values from the same argument, while `--threads` and `--memlimit` consume a following word. These flags remain report-only.

`ctest -N` is not fixed because `--show-only` accepts an optional argument that `-N` does not. `standard-version -n` and `--no-verify` populate different parser properties. Trash's `-v` changed meaning between releases, and Docker can forward original options to plugins, so both commands remain report-only.

Command-specific meanings also affect fixing boundaries: `web-dev-server -h` takes a hostname, `semver -v` takes a version to validate, and CoffeeScript's `-e` takes inline code despite being declared boolean by its parser. Each is fixed, then further fixing stops for that invocation.

Unknown options, positional arguments, redirections, bundles, attached values, and escaped or dynamic words stop further fixing. Later short-form arguments are still reported. For example, `prettier -w .` is fixed, while `prettier . -w` is only reported. `eslint -c config.js -f json` fixes `-c` and leaves `-f` for manual correction.

Fixes preserve whitespace and quoting within the script. Scripts containing `<<`, dollar signs, or backticks are never autofixed, since heredocs and shell expansion can contain literal text that resembles commands.

## Options

### `ignore`

Type: `string[]`\
Default: `[]`

Exact, case-sensitive executable names whose entire invocation is exempt from reporting and fixing. Surrounding quotes are removed before matching, but paths and file extensions are not normalized: `sh`, `./sh`, and `sh.cmd` are distinct. There are no built-in exceptions. An ignored command does not exempt subsequent commands in a chain.

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
