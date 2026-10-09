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
| [`ava`](https://github.com/avajs/ava/blob/v8.0.1/lib/cli.js) | `-c` → `--concurrency`, `-m` → `--match`, `-s` → `--serial`, `-t` → `--tap`, `-T` → `--timeout`, `-u` → `--update-snapshots`, `-v` → `--verbose`, `-w` → `--watch` |
| [`babel`](https://github.com/babel/babel/blob/main/packages/babel-cli/src/babel/options.ts) | `-w` → `--watch`, `-D` → `--copy-files`, `-f` → `--filename`, `-s` → `--source-maps`, `-x` → `--extensions`, `-o` → `--out-file`, `-d` → `--out-dir` |
| [`babel-node`](https://github.com/babel/babel/blob/main/packages/babel-node/src/program-setup.ts) | `-e` → `--eval`, `-r` → `--require`, `-p` → `--print`, `-o` → `--only`, `-i` → `--ignore`, `-x` → `--extensions`, `-w` → `--plugins`, `-b` → `--presets` |
| [`black`](https://github.com/psf/black/blob/main/src/black/__init__.py) | `-c` → `--code`, `-l` → `--line-length`, `-t` → `--target-version`, `-x` → `--skip-source-first-line`, `-S` → `--skip-string-normalization`, `-C` → `--skip-magic-trailing-comma`, `-W` → `--workers`, `-q` → `--quiet`, `-v` → `--verbose`, `-h` → `--help` |
| [`browserify`](https://github.com/browserify/browserify/blob/master/bin/args.js) | `-d` → `--debug`, `-s` → `--standalone`, `-r` → `--require`, `-u` → `--exclude`, `-x` → `--external`, `-t` → `--transform`, `-i` → `--ignore`, `-o` → `--outfile`, `-e` → `--entry`, `-c` → `--command` |
| [`bun`](https://github.com/oven-sh/bun/blob/main/src/runtime/cli/Arguments.rs) | `-c` → `--config`, `-l` → `--loader`, `-F` → `--filter`, `-b` → `--bun`, `-h` → `--help`, `-v` → `--version` |
| [`c8`](https://github.com/bcoe/c8/blob/v12.0.0/lib/parse-args.js) | `-c` → `--config`, `-r` → `--reporter`, `-o` → `--reports-dir`, `-n` → `--include`, `-x` → `--exclude`, `-e` → `--extension`, `-a` → `--exclude-after-remap` |
| [`chokidar`](https://github.com/open-cli-tools/chokidar-cli/blob/master/index.js) | `-c` → `--command`, `-d` → `--debounce`, `-t` → `--throttle`, `-s` → `--follow-symlinks`, `-i` → `--ignore`, `-p` → `--polling`, `-h` → `--help`, `-v` → `--version` |
| [`cleancss`](https://github.com/clean-css/clean-css-cli/blob/master/index.js) | `-b` → `--batch`, `-c` → `--compatibility`, `-d` → `--debug`, `-f` → `--format`, `-h` → `--help`, `-o` → `--output`, `-v` → `--version` |
| [`coffee`](https://github.com/jashkenas/coffeescript/blob/main/src/command.coffee) | `-b` → `--bare`, `-c` → `--compile`, `-e` → `--eval`, `-h` → `--help`, `-i` → `--interactive`, `-j` → `--join`, `-l` → `--literate`, `-m` → `--map`, `-M` → `--inline-map`, `-n` → `--nodes`, `-o` → `--output`, `-p` → `--print`, `-r` → `--require`, `-s` → `--stdio`, `-t` → `--transpile`, `-v` → `--version`, `-w` → `--watch` |
| [`conc`](https://github.com/open-cli-tools/concurrently/blob/main/bin/index.ts) | `-r` → `--raw`, `-g` → `--group`, `-k` → `--kill-others`, `-i` → `--handle-input`, `-m` → `--max-processes`, `-n` → `--names`, `-P` → `--passthrough-arguments`, `-p` → `--prefix`, `-c` → `--prefix-colors`, `-l` → `--prefix-length`, `-t` → `--timestamp-format` |
| [`concurrently`](https://github.com/open-cli-tools/concurrently/blob/main/bin/index.ts) | `-r` → `--raw`, `-g` → `--group`, `-k` → `--kill-others`, `-i` → `--handle-input`, `-m` → `--max-processes`, `-n` → `--names`, `-P` → `--passthrough-arguments`, `-p` → `--prefix`, `-c` → `--prefix-colors`, `-l` → `--prefix-length`, `-t` → `--timestamp-format` |
| [`copyfiles`](https://github.com/calvinmetcalf/copyfiles/blob/master/copyfiles) | `-a` → `--all`, `-f` → `--flat`, `-E` → `--error`, `-V` → `--verbose`, `-s` → `--soft`, `-F` → `--follow`, `-u` → `--up`, `-e` → `--exclude` |
| [`copyup`](https://github.com/calvinmetcalf/copyfiles/blob/master/copyfiles) | `-a` → `--all`, `-f` → `--flat`, `-E` → `--error`, `-V` → `--verbose`, `-s` → `--soft`, `-F` → `--follow`, `-u` → `--up`, `-e` → `--exclude` |
| [`cspell`](https://github.com/streetsidesoftware/cspell/blob/9550bbc967a4befe527d6440659e6534eddbcc2e/packages/cspell/src/commandLint.ts) | `-c` → `--config`, `-v` → `--verbose`, `-u` → `--unique`, `-e` → `--exclude`, `-r` → `--root` |
| [`cucumber-js`](https://github.com/cucumber/cucumber-js/blob/81936501473191a4fe7fb0f26f51e455305c9d4a/src/configuration/argv_parser.ts) | `-b` → `--backtrace`, `-c` → `--config`, `-d` → `--dry-run`, `-f` → `--format`, `-i` → `--import`, `-l` → `--loader`, `-p` → `--profile`, `-r` → `--require`, `-t` → `--tags`, `-v` → `--version` |
| [`curl`](https://github.com/curl/curl/blob/master/src/tool_getparam.c) | `-a` → `--append`, `-A` → `--user-agent`, `-b` → `--cookie`, `-B` → `--use-ascii`, `-c` → `--cookie-jar`, `-C` → `--continue-at`, `-d` → `--data`, `-D` → `--dump-header`, `-e` → `--referer`, `-E` → `--cert`, `-f` → `--fail`, `-F` → `--form`, `-g` → `--globoff`, `-G` → `--get`, `-h` → `--help`, `-H` → `--header`, `-i` → `--include`, `-I` → `--head`, `-j` → `--junk-session-cookies`, `-J` → `--remote-header-name`, `-k` → `--insecure`, `-K` → `--config`, `-l` → `--list-only`, `-L` → `--location`, `-m` → `--max-time`, `-M` → `--manual`, `-n` → `--netrc`, `-N` → `--no-buffer`, `-o` → `--output`, `-O` → `--remote-name`, `-p` → `--proxytunnel`, `-P` → `--ftp-port`, `-q` → `--disable`, `-Q` → `--quote`, `-r` → `--range`, `-R` → `--remote-time`, `-s` → `--silent`, `-S` → `--show-error`, `-t` → `--telnet-option`, `-T` → `--upload-file`, `-u` → `--user`, `-U` → `--proxy-user`, `-v` → `--verbose`, `-V` → `--version`, `-w` → `--write-out`, `-x` → `--proxy`, `-X` → `--request`, `-y` → `--speed-time`, `-Y` → `--speed-limit`, `-z` → `--time-cond`, `-Z` → `--parallel` |
| [`del-cli`](https://github.com/sindresorhus/del-cli/blob/main/cli.js) | `-f` → `--force`, `-d` → `--dry-run`, `-v` → `--verbose` |
| [`dprint`](https://github.com/dprint/dprint/blob/080b246b3576f0d199b5481fa91c88305c50ccb1/crates/dprint/src/arg_parser.rs) | `-c` → `--config`, `-L` → `--log-level` |
| [`ejs`](https://github.com/mde/ejs/blob/main/bin/cli.js) | `-o` → `--output-file`, `-f` → `--data-file`, `-i` → `--data-input`, `-m` → `--delimiter`, `-p` → `--open-delimiter`, `-c` → `--close-delimiter`, `-l` → `--locals-name`, `-s` → `--strict`, `-n` → `--no-with`, `-w` → `--rm-whitespace`, `-d` → `--debug`, `-h` → `--help`, `-V` → `--version`, `-v` → `--version` |
| [`env-cmd`](https://github.com/toddbluhm/env-cmd/blob/master/src/parse-args.ts) | `-e` → `--environments`, `-f` → `--file`, `-x` → `--expand-envs`, `-v` → `--version` |
| [`eslint`](https://github.com/eslint/eslint/blob/main/lib/options.js) | `-c` → `--config`, `-o` → `--output-file`, `-f` → `--format`, `-h` → `--help`, `-v` → `--version` |
| [`eslint_d`](https://github.com/mantoni/eslint_d.js/blob/5562045e54e6c62053ebf690f0ae57729d8bc448/lib/service.js) | `-c` → `--config`, `-o` → `--output-file`, `-f` → `--format`, `-h` → `--help`, `-v` → `--version` |
| [`flake8`](https://github.com/PyCQA/flake8/blob/main/src/flake8/main/options.py) | `-v` → `--verbose`, `-q` → `--quiet`, `-j` → `--jobs` |
| [`git`](https://github.com/git/git/blob/master/git.c) | `-p` → `--paginate`, `-P` → `--no-pager`, `-h` → `--help`, `-v` → `--version` |
| [`grunt`](https://github.com/gruntjs/grunt-known-options/blob/main/index.js) | `-h` → `--help`, `-b` → `--base`, `-d` → `--debug`, `-f` → `--force`, `-v` → `--verbose`, `-V` → `--version`, `-p` → `--preload` |
| [`gulp`](https://github.com/gulpjs/gulp-cli/blob/main/lib/shared/options/cli-options.js) | `-h` → `--help`, `-v` → `--version`, `-f` → `--gulpfile`, `-T` → `--tasks`, `-S` → `--silent`, `-L` → `--log-level` |
| [`html-minifier`](https://github.com/kangax/html-minifier/blob/gh-pages/cli.js) | `-o` → `--output`, `-c` → `--config-file` |
| [`html-minifier-terser`](https://github.com/terser/html-minifier-terser/blob/master/cli.js) | `-o` → `--output`, `-c` → `--config-file` |
| [`html-validate`](https://github.com/html-validate/html-validate/blob/master/src/cli/html-validate.ts) | `-c` → `--config`, `-f` → `--formatter`, `-h` → `--help`, `-p` → `--preset` |
| [`htmlhint`](https://github.com/htmlhint/HTMLHint/blob/main/src/cli/htmlhint.ts) | `-l` → `--list`, `-c` → `--config`, `-r` → `--rules`, `-R` → `--rulesdir`, `-f` → `--format`, `-i` → `--ignore`, `-h` → `--help`, `-V` → `--version` |
| [`isort`](https://github.com/PyCQA/isort/blob/main/isort/main.py) | `-h` → `--help`, `-V` → `--version`, `-v` → `--verbose`, `-q` → `--quiet`, `-d` → `--stdout`, `-c` → `--check-only`, `-j` → `--jobs`, `-s` → `--skip`, `-a` → `--add-import`, `-e` → `--balanced`, `-i` → `--indent`, `-m` → `--multi-line`, `-n` → `--ensure-newline-before-comments`, `-l` → `--line-length`, `-w` → `--line-length`, `-t` → `--top`, `-b` → `--builtin`, `-f` → `--future`, `-o` → `--thirdparty`, `-p` → `--project` |
| [`jest`](https://github.com/jestjs/jest/blob/v30.5.2/packages/jest-cli/src/args.ts) | `-b` → `--bail`, `-c` → `--config`, `-e` → `--expand`, `-w` → `--maxWorkers`, `-o` → `--onlyChanged`, `-f` → `--onlyFailures`, `-i` → `--runInBand`, `-t` → `--testNamePattern`, `-u` → `--updateSnapshot` |
| [`jq`](https://github.com/jqlang/jq/blob/master/src/main.c) | `-s` → `--slurp`, `-r` → `--raw-output`, `-j` → `--join-output`, `-c` → `--compact-output`, `-C` → `--color-output`, `-M` → `--monochrome-output`, `-a` → `--ascii-output`, `-S` → `--sort-keys`, `-R` → `--raw-input`, `-n` → `--null-input`, `-f` → `--from-file`, `-e` → `--exit-status`, `-h` → `--help`, `-V` → `--version` |
| [`json5`](https://github.com/json5/json5/blob/main/lib/cli.js) | `-c` → `--convert`, `-s` → `--space`, `-v` → `--validate`, `-o` → `--out-file`, `-V` → `--version`, `-h` → `--help` |
| [`knip`](https://github.com/webpro-nl/knip/blob/13d7f21e8ec5b30d8fe6d8377c9012b9db96f871/packages/knip/src/util/cli-arguments.ts) | `-c` → `--config`, `-d` → `--debug`, `-D` → `--directory`, `-f` → `--fix`, `-F` → `--format`, `-h` → `--help`, `-n` → `--no-progress`, `-p` → `--production`, `-u` → `--duration`, `-s` → `--strict`, `-t` → `--tsConfig`, `-V` → `--version`, `-w` → `--watch`, `-W` → `--workspace` |
| [`lessc`](https://github.com/less/less.js/blob/master/packages/less/bin/lessc) | `-s` → `--silent`, `-l` → `--lint`, `-x` → `--compress`, `-M` → `--depends` |
| [`lightningcss`](https://github.com/parcel-bundler/lightningcss/blob/master/src/main.rs) | `-o` → `--output-file`, `-d` → `--output-dir`, `-m` → `--minify`, `-t` → `--targets` |
| [`lint-staged`](https://github.com/lint-staged/lint-staged/blob/v17.6.0/lib/cli.js) | `-h` → `--help`, `-V` → `--version`, `-p` → `--concurrent`, `-c` → `--config`, `-d` → `--debug`, `-q` → `--quiet`, `-r` → `--relative`, `-v` → `--verbose` |
| [`markdown-it`](https://github.com/markdown-it/markdown-it/blob/master/bin/markdown-it.mjs) | `-v` → `--version`, `-l` → `--linkify`, `-t` → `--typographer`, `-o` → `--output` |
| [`markdownlint`](https://github.com/igorshubovych/markdownlint-cli/blob/v0.49.1/markdownlint.js) | `-c` → `--config`, `-d` → `--dot`, `-f` → `--fix`, `-i` → `--ignore`, `-j` → `--json`, `-o` → `--output`, `-p` → `--ignore-path`, `-q` → `--quiet`, `-r` → `--rules`, `-s` → `--stdin` |
| [`marked`](https://github.com/markedjs/marked/blob/master/bin/main.js) | `-o` → `--output`, `-i` → `--input`, `-s` → `--string`, `-t` → `--tokens`, `-c` → `--config`, `-n` → `--no-clobber`, `-h` → `--help`, `-v` → `--version` |
| [`mkdirp`](https://github.com/isaacs/node-mkdirp/blob/main/src/bin.ts) | `-p` → `--print`, `-h` → `--help`, `-v` → `--version` |
| [`mocha`](https://github.com/mochajs/mocha/blob/v12.0.3/lib/cli/run-option-metadata.cjs) | `-A` → `--async-only`, `-b` → `--bail`, `-c` → `--color`, `-C` → `--no-colors`, `-f` → `--fgrep`, `-g` → `--grep`, `-i` → `--invert`, `-j` → `--jobs`, `-n` → `--node-option`, `-p` → `--parallel`, `-R` → `--reporter`, `-O` → `--reporter-option`, `-r` → `--require`, `-s` → `--slow`, `-S` → `--sort`, `-t` → `--timeout`, `-u` → `--ui`, `-w` → `--watch` |
| [`mypy`](https://github.com/python/mypy/blob/master/mypy/main.py) | `-h` → `--help`, `-v` → `--verbose`, `-V` → `--version`, `-O` → `--output`, `-i` → `--incremental`, `-m` → `--module`, `-p` → `--package`, `-c` → `--command` |
| [`ncu`](https://github.com/raineorshine/npm-check-updates/blob/main/src/cli-options.ts) | `-d` → `--doctor`, `-e` → `--errorLevel`, `-g` → `--global`, `-h` → `--help`, `-i` → `--interactive`, `-j` → `--jsonAll`, `-l` → `--loglevel`, `-m` → `--minimal`, `-p` → `--packageManager`, `-r` → `--registry`, `-s` → `--silent`, `-t` → `--target`, `-u` → `--upgrade`, `-v` → `--version`, `-V` → `--version` |
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
| [`pnpm`](https://github.com/pnpm/pnpm/blob/main/pnpm/crates/cli/src/cli_args/cli_command.rs) | `-r` → `--recursive`, `-C` → `--dir`, `-w` → `--workspace-root`, `-F` → `--filter`, `-y` → `--yes`, `-h` → `--help`, `-v` → `--version` |
| [`postcss`](https://github.com/postcss/postcss-cli/blob/master/lib/args.js) | `-r` → `--replace`, `-w` → `--watch`, `-o` → `--output`, `-d` → `--dir`, `-m` → `--map`, `-u` → `--use` |
| [`prettier`](https://github.com/prettier/prettier/blob/main/src/cli/cli-options.evaluate.js) | `-c` → `--check`, `-l` → `--list-different`, `-w` → `--write`, `-u` → `--ignore-unknown`, `-v` → `--version`, `-h` → `--help` |
| [`prettier-eslint`](https://github.com/prettier/prettier-eslint-cli/blob/9167781098e8cb484b60e70516c78791924c569c/src/parser.ts) | `-h` → `--help`, `-l` → `--log-level` |
| [`prettier-package-json`](https://github.com/cameronhunter/prettier-package-json/blob/cd4b5916758ec8f7a3300060d2847f27379c7b72/bin/prettier-package-json) | `-l` → `--list-different` |
| [`pug`](https://github.com/pugjs/pug-cli/blob/master/index.js) | `-O` → `--obj`, `-o` → `--out`, `-p` → `--path`, `-b` → `--basedir`, `-P` → `--pretty`, `-c` → `--client`, `-n` → `--name`, `-D` → `--no-debug`, `-w` → `--watch`, `-E` → `--extension`, `-s` → `--silent` |
| [`pug-cli`](https://github.com/pugjs/pug-cli/blob/master/index.js) | `-O` → `--obj`, `-o` → `--out`, `-p` → `--path`, `-b` → `--basedir`, `-P` → `--pretty`, `-c` → `--client`, `-n` → `--name`, `-D` → `--no-debug`, `-w` → `--watch`, `-E` → `--extension`, `-s` → `--silent` |
| [`pug-lint`](https://github.com/pugjs/pug-lint/blob/master/lib/cli.js) | `-c` → `--config`, `-r` → `--reporter` |
| [`py.test`](https://github.com/pytest-dev/pytest/blob/main/src/_pytest/terminal.py), [main options](https://github.com/pytest-dev/pytest/blob/main/src/_pytest/main.py) | `-x` → `--exitfirst`, `-W` → `--pythonwarnings`, `-v` → `--verbose`, `-q` → `--quiet`, `-l` → `--showlocals`, `-c` → `--config-file` |
| [`pylint`](https://github.com/pylint-dev/pylint/blob/main/pylint/lint/base_options.py) | `-f` → `--output-format`, `-r` → `--reports`, `-s` → `--score`, `-e` → `--enable`, `-d` → `--disable`, `-j` → `--jobs`, `-E` → `--errors-only`, `-v` → `--verbose` |
| [`pytest`](https://github.com/pytest-dev/pytest/blob/main/src/_pytest/terminal.py), [main options](https://github.com/pytest-dev/pytest/blob/main/src/_pytest/main.py) | `-x` → `--exitfirst`, `-W` → `--pythonwarnings`, `-v` → `--verbose`, `-q` → `--quiet`, `-l` → `--showlocals`, `-c` → `--config-file` |
| [`qunit`](https://github.com/qunitjs/qunit/blob/main/bin/qunit.js) | `-f` → `--filter`, `-m` → `--module`, `-r` → `--reporter`, `-w` → `--watch`, `-h` → `--help`, `-V` → `--version` |
| [`rehype`](https://github.com/unifiedjs/unified-args/blob/main/lib/schema.js) | `-e` → `--ext`, `-f` → `--frail`, `-h` → `--help`, `-i` → `--ignore-path`, `-o` → `--output`, `-q` → `--quiet`, `-r` → `--rc-path`, `-s` → `--setting`, `-S` → `--silent`, `-t` → `--tree`, `-u` → `--use`, `-v` → `--version`, `-w` → `--watch` |
| [`release-it`](https://github.com/release-it/release-it/blob/main/lib/args.js) | `-c` → `--config`, `-d` → `--dry-run`, `-h` → `--help`, `-i` → `--increment`, `-v` → `--version`, `-V` → `--verbose` |
| [`remark`](https://github.com/unifiedjs/unified-args/blob/main/lib/schema.js) | `-e` → `--ext`, `-f` → `--frail`, `-h` → `--help`, `-i` → `--ignore-path`, `-o` → `--output`, `-q` → `--quiet`, `-r` → `--rc-path`, `-s` → `--setting`, `-S` → `--silent`, `-t` → `--tree`, `-u` → `--use`, `-v` → `--version`, `-w` → `--watch` |
| [`rimraf`](https://github.com/isaacs/rimraf/blob/main/src/bin.mts) | `-g` → `--glob`, `-G` → `--no-glob`, `-v` → `--verbose`, `-V` → `--no-verbose`, `-i` → `--interactive`, `-I` → `--no-interactive` |
| [`rollup`](https://github.com/rollup/rollup/blob/master/src/utils/options/mergeOptions.ts) | `-c` → `--config`, `-d` → `--dir`, `-e` → `--external`, `-f` → `--format`, `-g` → `--globals`, `-i` → `--input`, `-m` → `--sourcemap`, `-n` → `--name`, `-o` → `--file`, `-p` → `--plugin`, `-w` → `--watch` |
| [`ruff`](https://github.com/astral-sh/ruff/blob/main/crates/ruff/src/args.rs) | `-v` → `--verbose`, `-q` → `--quiet`, `-s` → `--silent` |
| [`run-p`](https://github.com/bcomnes/npm-run-all2/blob/master/bin/common/parse-cli-args.js) | `-c` → `--continue-on-error`, `-l` → `--print-label`, `-n` → `--print-name`, `-r` → `--race`, `-s` → `--silent` |
| [`run-s`](https://github.com/bcomnes/npm-run-all2/blob/master/bin/common/parse-cli-args.js) | `-c` → `--continue-on-error`, `-l` → `--print-label`, `-n` → `--print-name`, `-s` → `--silent` |
| [`rush`](https://github.com/microsoft/rushstack/blob/main/libraries/rush-lib/src/cli/RushCommandLineParser.ts) | `-d` → `--debug`, `-q` → `--quiet` |
| [`sass`](https://github.com/sass/dart-sass/blob/main/lib/src/executable/options.dart) | `-q` → `--quiet`, `-w` → `--watch`, `-c` → `--color`, `-I` → `--load-path`, `-p` → `--pkg-importer`, `-s` → `--style`, `-i` → `--interactive` |
| [`sass-lint`](https://github.com/sasstools/sass-lint/blob/master/bin/sass-lint.js) | `-c` → `--config`, `-i` → `--ignore`, `-q` → `--no-exit`, `-v` → `--verbose`, `-f` → `--format`, `-o` → `--output`, `-s` → `--syntax` |
| [`semver`](https://github.com/npm/node-semver/blob/main/bin/semver.js) | `-l` → `--loose`, `-p` → `--include-prerelease`, `-v` → `--version`, `-i` → `--increment`, `-r` → `--range`, `-c` → `--coerce`, `-h` → `--help` |
| [`serve`](https://github.com/vercel/serve/blob/main/source/utilities/cli.ts) | `-s` → `--single`, `-d` → `--debug`, `-L` → `--no-request-logging`, `-C` → `--cors`, `-n` → `--no-clipboard`, `-u` → `--no-compression`, `-S` → `--symlinks`, `-l` → `--listen`, `-c` → `--config` |
| [`sort-package-json`](https://github.com/keithamus/sort-package-json/blob/main/cli.js) | `-c` → `--check`, `-q` → `--quiet`, `-i` → `--ignore`, `-v` → `--version`, `-h` → `--help` |
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
| [`tsup`](https://github.com/egoist/tsup/blob/main/src/cli-main.ts) | `-d` → `--out-dir` |
| [`tsx`](https://github.com/privatenumber/tsx/blob/master/src/cli.ts) | `-e` → `--eval`, `-p` → `--print` |
| [`turbo`](https://github.com/vercel/turborepo/blob/main/crates/turborepo-cli/src/cli/args.rs) | `-F` → `--filter`, `-h` → `--help` |
| [`uglifyjs`](https://github.com/mishoo/UglifyJS/blob/master/bin/uglifyjs) | `-b` → `--beautify`, `-c` → `--compress`, `-d` → `--define`, `-e` → `--enclose`, `-h` → `--help`, `-m` → `--mangle`, `-o` → `--output`, `-O` → `--output-opts`, `-p` → `--parse`, `-v` → `--version`, `-V` → `--version` |
| [`vite`](https://github.com/vitejs/vite/blob/main/packages/vite/src/node/cli.ts) | `-c` → `--config`, `-l` → `--logLevel`, `-d` → `--debug`, `-f` → `--filter`, `-m` → `--mode` |
| [`vitest`](https://github.com/vitest-dev/vitest/blob/v5.0.3/packages/vitest/src/node/cli/cli-config.ts) | `-r` → `--root`, `-c` → `--config`, `-u` → `--update`, `-w` → `--watch`, `-t` → `--testNamePattern`, `-p` → `--project` |
| [`vue-tsc`](https://github.com/vuejs/language-tools/blob/master/packages/tsc/index.ts) | `-b` → `--build`, `-w` → `--watch`, `-h` → `--help`, `-p` → `--project`, `-t` → `--target`, `-m` → `--module`, `-i` → `--incremental` |
| [`wait-on`](https://github.com/jeffbski/wait-on/blob/master/bin/wait-on) | `-c` → `--config`, `-d` → `--delay`, `-i` → `--interval`, `-l` → `--log`, `-r` → `--reverse`, `-s` → `--simultaneous`, `-t` → `--timeout`, `-v` → `--verbose`, `-w` → `--window`, `-h` → `--help` |
| [`watchify`](https://github.com/browserify/watchify/blob/master/bin/args.js) | `-d` → `--debug`, `-s` → `--standalone`, `-r` → `--require`, `-u` → `--exclude`, `-x` → `--external`, `-t` → `--transform`, `-i` → `--ignore`, `-o` → `--outfile`, `-e` → `--entry`, `-c` → `--command` |
| [`wds`](https://github.com/modernweb-dev/web/blob/master/packages/dev-server/src/config/readCliArgs.ts) | `-c` → `--config`, `-r` → `--root-dir`, `-b` → `--base-path`, `-o` → `--open`, `-a` → `--app-index`, `-w` → `--watch`, `-p` → `--port`, `-h` → `--hostname` |
| [`web-dev-server`](https://github.com/modernweb-dev/web/blob/master/packages/dev-server/src/config/readCliArgs.ts) | `-c` → `--config`, `-r` → `--root-dir`, `-b` → `--base-path`, `-o` → `--open`, `-a` → `--app-index`, `-w` → `--watch`, `-p` → `--port`, `-h` → `--hostname` |
| [`webpack`](https://github.com/webpack/webpack-cli/blob/main/OPTIONS.md) | `-m` → `--merge`, `-w` → `--watch`, `-c` → `--config`, `-j` → `--json`, `-o` → `--output-path`, `-t` → `--target` |
| [`webpack-cli`](https://github.com/webpack/webpack-cli/blob/main/OPTIONS.md) | `-m` → `--merge`, `-w` → `--watch`, `-c` → `--config`, `-j` → `--json`, `-o` → `--output-path`, `-t` → `--target` |
| [`webpack-dev-server`](https://github.com/webpack/webpack-cli/blob/main/packages/webpack-cli/src/webpack-cli.ts) | `-w` → `--watch`, `-c` → `--config`, `-j` → `--json`, `-t` → `--target` |

Fixing continues through known options that do not consume a value and their exact long equivalents. An option that takes a value or optional argument is fixed, then fixing stops for that invocation. Fixing also stops after `tsc -b` or `--build`, because build mode changes the meaning of other aliases. TypeScript's `-v` and `-d` are not fixed.

Untyped options that can consume the next word also stop fixing, including every supported Rollup alias. Execution mode switches such as `npm-run-all -p` and `sass -i` stop fixing too.

Mappings are command-specific and case-sensitive: Jest's `-w` means `--maxWorkers`, while AVA's means `--watch`; `npm-run-all -s` means `--sequential`, while `run-p -s` means `--silent`. Aliases with conflicting meanings, such as Bun's `-p` and webpack's `-d`, are reported without fixes. Tool versions are not resolved, so only verified aliases are included.

`http-server`, `tailwindcss`, `dotenv`, `degit`, and `sirv` flags remain report-only because their parsers read some short and long names separately. Replacing a short name can change which value wins.

Some genuine parser aliases are also unsafe to replace: `ncu -f` and `-x` can accumulate configuration-file filters differently after rewriting, and `cspell -s` changes meaning in subcommands. `vite-node`, `dotenvx`, and `dx` remain report-only because they can forward the original CLI flags to another command. Deno's `-V` is not fixed because its version output differs from `--version`.

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
