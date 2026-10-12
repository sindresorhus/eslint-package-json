# no-short-flags-in-scripts

📝 Disallow short-form flags in scripts.

💼 This rule is enabled in the ✅ `recommended` [config](https://github.com/sindresorhus/eslint-package-json#configs).

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->
<!-- Do not manually modify this header. Run: `npm run fix:eslint-docs` -->

Use long-form flags in `scripts` for readability. Supports simple command chains, environment assignments, and quoted words; wrappers, paths, and nested commands are not resolved.

Reports single-dash arguments starting with an ASCII letter, including bundles, attached values, and flag-looking values. A standalone `--` ends checking for that command. Redirection targets, bare `-`, and negative numbers are ignored.

## Examples

```json
// ❌
{
	"scripts": {
		"format": "prettier -w ."
	}
}
```

```json
// ✅
{
	"scripts": {
		"format": "prettier --write ."
	}
}
```

## Built-in exemptions

Always exempts these commands because common options lack usable or portable long equivalents:

- Shells and builtins: `[`, `bash`, `cd`, `command`, `dash`, `echo`, `env`, `pwd`, `read`, `set`, `sh`, `test`, `ulimit`, `zsh`.
- Portable utilities: `awk`, `cat`, `chgrp`, `chmod`, `chown`, `cp`, `cut`, `date`, `df`, `du`, `find`, `install`, `kill`, `ln`, `ls`, `mkdir`, `mv`, `ps`, `readlink`, `rm`, `rmdir`, `sed`, `stat`, `tail`, `tee`, `touch`, `tr`, `uname`, `unzip`, `wc`, `xargs`.
- Developer tools: `c++`, `cc`, `clang`, `clang++`, `cmake`, `g++`, `gcc`, `git`, `java`, `javac`, `make`, `perl`, `python`, `python3`, `ruby`, `scp`, `ssh`, `swift`, `swiftc`, `xcodebuild`.
- Media tools: `composite`, `convert`, `cwebp`, `dwebp`, `ffmpeg`, `ffprobe`, `gs`, `identify`, `magick`, `mogrify`, `montage`.

## Autofixing

Fixes known standalone aliases in leading options, preserving whitespace and quotes. Stops after a value-taking option or mode switch, or before an unknown option, positional argument, redirection, bundle, or attached value. For example, `eslint -c config.js -f json` fixes only `-c`; `-f` is still reported.

Scripts containing `<<`, `$`, or backticks are not autofixed. Coverage is partial; installed versions are not checked. Vite, Vitest, and tsup are report-only because rewriting aliases can change precedence.

## Options

### `ignore`

Type: `string[]`\
Default: `[]`

Additional commands to exempt from reporting and fixing. Matching is exact and case-sensitive after removing quotes: `sh`, `./sh`, and `sh.cmd` differ. Built-in exemptions always apply; later commands in a chain remain checked.

With `{ignore: ['custom-tool']}`:

```json
// ❌
{
	"scripts": {
		"format": "custom-tool -x && prettier -w ."
	}
}
```

```json
// ✅
{
	"scripts": {
		"format": "custom-tool -x && prettier --write ."
	}
}
```

See the [rule source](../../rules/no-short-flags-in-scripts.js) for supported CLIs and aliases.
