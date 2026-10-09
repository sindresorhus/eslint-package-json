import {
	getKey,
	getRootObject,
	iterateScripts,
	optionsSchema,
	scriptTokenPattern,
	stringArraySchema,
} from './utils/index.js';

const MESSAGE_ID = 'no-short-flags-in-scripts';

const messages = {
	[MESSAGE_ID]: 'The `{{script}}` script uses the short-form flag `{{flag}}`. Use long-form flags for readability.',
};

// Each entry is [short name, long name, stops fixing]. Value-taking options, optional arguments, and mode switches end the unambiguous leading option sequence.
// Verified against each tool's CLI definitions. TypeScript's `-v` and `-d` are omitted because their meanings change in build mode.
// The rule documentation links to the upstream definitions for each command. Untyped options (such as Rollup's) also stop fixing because their parsers can consume a value.
const commandAliases = new Map([
	['ava', [
		['c', 'concurrency', true],
		['m', 'match', true],
		['s', 'serial'],
		['t', 'tap'],
		['T', 'timeout', true],
		['u', 'update-snapshots'],
		['v', 'verbose'],
		['w', 'watch'],
	]],
	['babel', [
		['w', 'watch'],
		['D', 'copy-files'],
		['f', 'filename', true],
		['s', 'source-maps', true],
		['x', 'extensions', true],
		['o', 'out-file', true],
		['d', 'out-dir', true],
	]],
	['bun', [
		['c', 'config', true],
		['l', 'loader', true],
		['F', 'filter', true],
		['b', 'bun'],
		['h', 'help'],
		['v', 'version'],
	]],
	['c8', [
		['c', 'config', true],
		['r', 'reporter', true],
		['o', 'reports-dir', true],
		['n', 'include', true],
		['x', 'exclude', true],
		['e', 'extension', true],
		['a', 'exclude-after-remap'],
	]],
	['conc', [
		['r', 'raw'],
		['g', 'group'],
		['k', 'kill-others'],
		['i', 'handle-input'],
		['m', 'max-processes', true],
		['n', 'names', true],
		['P', 'passthrough-arguments', true],
		['p', 'prefix', true],
		['c', 'prefix-colors', true],
		['l', 'prefix-length', true],
		['t', 'timestamp-format', true],
	]],
	['concurrently', [
		['r', 'raw'],
		['g', 'group'],
		['k', 'kill-others'],
		['i', 'handle-input'],
		['m', 'max-processes', true],
		['n', 'names', true],
		['P', 'passthrough-arguments', true],
		['p', 'prefix', true],
		['c', 'prefix-colors', true],
		['l', 'prefix-length', true],
		['t', 'timestamp-format', true],
	]],
	['copyfiles', [
		['a', 'all'],
		['f', 'flat'],
		['E', 'error'],
		['V', 'verbose'],
		['s', 'soft'],
		['F', 'follow'],
		['u', 'up', true],
		['e', 'exclude', true],
	]],
	['copyup', [
		['a', 'all'],
		['f', 'flat'],
		['E', 'error'],
		['V', 'verbose'],
		['s', 'soft'],
		['F', 'follow'],
		['u', 'up', true],
		['e', 'exclude', true],
	]],
	['curl', [
		['a', 'append'],
		['A', 'user-agent', true],
		['b', 'cookie', true],
		['B', 'use-ascii'],
		['c', 'cookie-jar', true],
		['C', 'continue-at', true],
		['d', 'data', true],
		['D', 'dump-header', true],
		['e', 'referer', true],
		['E', 'cert', true],
		['f', 'fail'],
		['F', 'form', true],
		['g', 'globoff'],
		['G', 'get'],
		['h', 'help', true],
		['H', 'header', true],
		['i', 'include'],
		['I', 'head'],
		['j', 'junk-session-cookies'],
		['J', 'remote-header-name'],
		['k', 'insecure'],
		['K', 'config', true],
		['l', 'list-only'],
		['L', 'location'],
		['m', 'max-time', true],
		['M', 'manual'],
		['n', 'netrc'],
		['N', 'no-buffer'],
		['o', 'output', true],
		['O', 'remote-name'],
		['p', 'proxytunnel'],
		['P', 'ftp-port', true],
		['q', 'disable'],
		['Q', 'quote', true],
		['r', 'range', true],
		['R', 'remote-time'],
		['s', 'silent'],
		['S', 'show-error'],
		['t', 'telnet-option', true],
		['T', 'upload-file', true],
		['u', 'user', true],
		['U', 'proxy-user', true],
		['v', 'verbose'],
		['V', 'version'],
		['w', 'write-out', true],
		['x', 'proxy', true],
		['X', 'request', true],
		['y', 'speed-time', true],
		['Y', 'speed-limit', true],
		['z', 'time-cond', true],
		['Z', 'parallel'],
	]],
	['del-cli', [
		['f', 'force'],
		['d', 'dry-run'],
		['v', 'verbose'],
	]],
	['eslint', [
		['c', 'config', true],
		['o', 'output-file', true],
		['f', 'format', true],
		['h', 'help'],
		['v', 'version'],
	]],
	['git', [
		['p', 'paginate'],
		['P', 'no-pager'],
		['h', 'help', true],
		['v', 'version', true],
	]],
	['jest', [
		['b', 'bail', true],
		['c', 'config', true],
		['e', 'expand'],
		['w', 'maxWorkers', true],
		['o', 'onlyChanged'],
		['f', 'onlyFailures'],
		['i', 'runInBand'],
		['t', 'testNamePattern', true],
		['u', 'updateSnapshot'],
	]],
	['jq', [
		['s', 'slurp'],
		['r', 'raw-output'],
		['j', 'join-output'],
		['c', 'compact-output'],
		['C', 'color-output'],
		['M', 'monochrome-output'],
		['a', 'ascii-output'],
		['S', 'sort-keys'],
		['R', 'raw-input'],
		['n', 'null-input'],
		['f', 'from-file', true],
		['e', 'exit-status'],
		['h', 'help'],
		['V', 'version'],
	]],
	['lessc', [
		['s', 'silent'],
		['l', 'lint'],
		['x', 'compress'],
		['M', 'depends'],
	]],
	['lint-staged', [
		['h', 'help'],
		['V', 'version'],
		['p', 'concurrent', true],
		['c', 'config', true],
		['d', 'debug'],
		['q', 'quiet'],
		['r', 'relative'],
		['v', 'verbose'],
	]],
	['markdownlint', [
		['c', 'config', true],
		['d', 'dot'],
		['f', 'fix'],
		['i', 'ignore', true],
		['j', 'json'],
		['o', 'output', true],
		['p', 'ignore-path', true],
		['q', 'quiet'],
		['r', 'rules', true],
		['s', 'stdin'],
	]],
	['mocha', [
		['A', 'async-only'],
		['b', 'bail'],
		['c', 'color'],
		['C', 'no-colors'],
		['f', 'fgrep', true],
		['g', 'grep', true],
		['i', 'invert'],
		['j', 'jobs', true],
		['n', 'node-option', true],
		['p', 'parallel'],
		['R', 'reporter', true],
		['O', 'reporter-option', true],
		['r', 'require', true],
		['s', 'slow', true],
		['S', 'sort'],
		['t', 'timeout', true],
		['u', 'ui', true],
		['w', 'watch'],
	]],
	['node', [
		['c', 'check'],
		['e', 'eval', true],
		['p', 'print', true],
		['r', 'require', true],
		['i', 'interactive'],
		['C', 'conditions', true],
		['h', 'help'],
		['v', 'version'],
	]],
	['nodemon', [
		['V', 'verbose'],
		['L', 'legacy-watch'],
		['q', 'quiet'],
		['I', 'no-stdin'],
		['C', 'on-change-only'],
		['P', 'polling-interval', true],
		['w', 'watch', true],
		['i', 'ignore', true],
		['d', 'delay', true],
		['x', 'exec', true],
		['e', 'ext', true],
		['s', 'signal', true],
	]],
	['npm', [
		['a', 'all'],
		['c', 'call', true],
		['f', 'force'],
		['g', 'global'],
		['L', 'location', true],
		['l', 'long'],
		['m', 'message', true],
		['p', 'parseable'],
		['C', 'prefix', true],
		['S', 'save'],
		['B', 'save-bundle'],
		['D', 'save-dev'],
		['E', 'save-exact'],
		['O', 'save-optional'],
		['P', 'save-prod'],
		['h', 'usage'],
		['H', 'usage'],
		['v', 'version'],
		['w', 'workspace', true],
		['y', 'yes', true],
	]],
	['npm-run-all', [
		['c', 'continue-on-error'],
		['l', 'print-label'],
		['n', 'print-name'],
		['r', 'race'],
		['p', 'parallel', true],
		['s', 'sequential', true],
	]],
	['npm-run-all2', [
		['c', 'continue-on-error'],
		['l', 'print-label'],
		['n', 'print-name'],
		['r', 'race'],
		['p', 'parallel', true],
		['s', 'sequential', true],
	]],
	['npx', [
		['a', 'all'],
		['c', 'call', true],
		['f', 'force'],
		['g', 'global'],
		['L', 'location', true],
		['l', 'long'],
		['m', 'message', true],
		['p', 'package', true],
		['C', 'prefix', true],
		['S', 'save'],
		['B', 'save-bundle'],
		['D', 'save-dev'],
		['E', 'save-exact'],
		['O', 'save-optional'],
		['P', 'save-prod'],
		['h', 'usage'],
		['H', 'usage'],
		['v', 'version'],
		['w', 'workspace', true],
		['y', 'yes', true],
	]],
	['nyc', [
		['t', 'temp-dir', true],
		['x', 'exclude', true],
		['n', 'include', true],
		['e', 'extension', true],
		['r', 'reporter', true],
		['s', 'silent'],
		['a', 'all'],
		['c', 'cache'],
		['i', 'require', true],
	]],
	['pnpm', [
		['r', 'recursive'],
		['C', 'dir', true],
		['w', 'workspace-root'],
		['F', 'filter', true],
		['y', 'yes'],
		['h', 'help'],
		['v', 'version'],
	]],
	['postcss', [
		['r', 'replace'],
		['w', 'watch'],
		['o', 'output', true],
		['d', 'dir', true],
		['m', 'map', true],
		['u', 'use', true],
	]],
	['prettier', [
		['c', 'check'],
		['l', 'list-different'],
		['w', 'write'],
		['u', 'ignore-unknown'],
		['v', 'version'],
		['h', 'help', true],
	]],
	['rimraf', [
		['g', 'glob'],
		['G', 'no-glob'],
		['v', 'verbose'],
		['V', 'no-verbose'],
		['i', 'interactive'],
		['I', 'no-interactive'],
	]],
	['rollup', [
		['c', 'config', true],
		['d', 'dir', true],
		['e', 'external', true],
		['f', 'format', true],
		['g', 'globals', true],
		['i', 'input', true],
		['m', 'sourcemap', true],
		['n', 'name', true],
		['o', 'file', true],
		['p', 'plugin', true],
		['w', 'watch', true],
	]],
	['run-p', [
		['c', 'continue-on-error'],
		['l', 'print-label'],
		['n', 'print-name'],
		['r', 'race'],
		['s', 'silent'],
	]],
	['run-s', [
		['c', 'continue-on-error'],
		['l', 'print-label'],
		['n', 'print-name'],
		['s', 'silent'],
	]],
	['rush', [
		['d', 'debug'],
		['q', 'quiet'],
	]],
	['sass', [
		['q', 'quiet'],
		['w', 'watch'],
		['c', 'color'],
		['I', 'load-path', true],
		['p', 'pkg-importer', true],
		['s', 'style', true],
		['i', 'interactive', true],
	]],
	['serve', [
		['s', 'single'],
		['d', 'debug'],
		['L', 'no-request-logging'],
		['C', 'cors'],
		['n', 'no-clipboard'],
		['u', 'no-compression'],
		['S', 'symlinks'],
		['l', 'listen', true],
		['c', 'config', true],
	]],
	['stylelint', [
		['c', 'config', true],
		['f', 'formatter', true],
		['h', 'help'],
		['i', 'ignore-path', true],
		['o', 'output-file', true],
		['q', 'quiet'],
		['v', 'version'],
	]],
	['swc', [
		['w', 'watch'],
		['q', 'quiet'],
		['D', 'copy-files'],
		['f', 'filename', true],
		['s', 'source-maps', true],
		['o', 'out-file', true],
		['d', 'out-dir', true],
		['C', 'config', true],
	]],
	['tap', [
		['R', 'reporter', true],
		['f', 'reporter-file', true],
		['r', 'reporter-arg', true],
		['c', 'color'],
		['C', 'no-color'],
		['b', 'bail'],
		['B', 'no-bail'],
		['t', 'timeout', true],
		['n', 'changed'],
		['s', 'save', true],
		['j', 'jobs', true],
		['o', 'output-file', true],
		['d', 'output-dir', true],
	]],
	['tsc', [
		['b', 'build', true],
		['w', 'watch'],
		['h', 'help', true],
		['p', 'project', true],
		['t', 'target', true],
		['m', 'module', true],
		['i', 'incremental'],
	]],
	['tsc-alias', [
		['w', 'watch'],
		['f', 'resolve-full-paths'],
		['v', 'verbose'],
		['p', 'project', true],
		['r', 'replacer', true],
	]],
	['tsup', [
		['d', 'out-dir', true],
	]],
	['tsx', [
		['e', 'eval', true],
		['p', 'print', true],
	]],
	['turbo', [
		['F', 'filter', true],
		['h', 'help'],
	]],
	['vite', [
		['c', 'config', true],
		['l', 'logLevel', true],
		['d', 'debug', true],
		['f', 'filter', true],
		['m', 'mode', true],
	]],
	['vitest', [
		['r', 'root', true],
		['c', 'config', true],
		['u', 'update', true],
		['w', 'watch'],
		['t', 'testNamePattern', true],
		['p', 'project', true],
	]],
	['webpack', [
		['m', 'merge'],
		['w', 'watch'],
		['c', 'config', true],
		['j', 'json', true],
		['o', 'output-path', true],
		['t', 'target', true],
	]],
	['webpack-cli', [
		['m', 'merge'],
		['w', 'watch'],
		['c', 'config', true],
		['j', 'json', true],
		['o', 'output-path', true],
		['t', 'target', true],
	]],
]);

/**
Remove one matching pair of surrounding quotes without interpreting escapes or expansions.
*/
const getUnquotedWord = token => {
	const quote = token[0];
	return token.length > 1 && (quote === '"' || quote === '\'') && token.endsWith(quote)
		? token.slice(1, -1)
		: token;
};

/**
Get the index of a redirection's operand, accounting for an adjacent file descriptor.
*/
const getRedirectionEnd = (tokens, index) => {
	const token = tokens[index];

	if (/^[<>]/u.test(token[0])) {
		return index + 1;
	}

	const next = tokens[index + 1];

	// A descriptor belongs to the redirect only when adjacent, as in `2>out` or `2>&1`.
	if (/^\d+$/u.test(token[0]) && next && /^[<>]/u.test(next[0]) && token.index + token[0].length === next.index) {
		return index + 2;
	}
};

/**
Find short-form arguments and replace verified aliases only while their command's leading options remain unambiguous.
*/
const getScriptResult = (script, ignoredCommands) => {
	const tokens = script.matchAll(scriptTokenPattern).toArray();
	const shouldFix = !script.includes('<<') && !script.includes('$') && !script.includes('`');
	const replacements = [];
	let isCommand = true;
	let shouldCheckArguments = false;
	let canFix = shouldFix;
	let aliases;
	let firstFlag;

	for (let index = 0; index < tokens.length; index++) {
		const [token] = tokens[index];

		if (/^[\n&;|]$/u.test(token)) {
			isCommand = true;
			shouldCheckArguments = false;
			canFix = shouldFix;
			continue;
		}

		if (token.startsWith('#')) {
			continue;
		}

		const redirectionEnd = getRedirectionEnd(tokens, index);

		if (redirectionEnd !== undefined) {
			index = redirectionEnd;
			canFix = false;
			continue;
		}

		if (isCommand) {
			if (/^[a-z_]\w*=/iu.test(token)) {
				continue;
			}

			isCommand = false;
			const command = getUnquotedWord(token);
			shouldCheckArguments = !ignoredCommands.has(command);
			aliases = commandAliases.get(command);
			continue;
		}

		if (!shouldCheckArguments) {
			continue;
		}

		const word = getUnquotedWord(token);

		if (word === '--') {
			shouldCheckArguments = false;
			canFix = false;
			continue;
		}

		if (/^-[A-Za-z]/u.test(word)) {
			firstFlag ??= word;
		}

		if (!canFix) {
			continue;
		}

		const alias = aliases?.find(([short, long]) => word === `-${short}` || word === `--${long}`);

		if (!alias) {
			canFix = false;
			continue;
		}

		const [short, long, stopsFixing] = alias;

		if (word === `-${short}`) {
			replacements.push({index: tokens[index].index, token, text: token.replace(word, `--${long}`)});
		}

		// Long equivalents stop at exactly the same boundary, so later fix passes cannot start interpreting an option value as another flag.
		if (stopsFixing) {
			canFix = false;
		}
	}

	let replacement = script;

	for (const {index, token, text} of replacements.toReversed()) {
		replacement = replacement.slice(0, index) + text + replacement.slice(index + token.length);
	}

	return {firstFlag, replacement};
};

/** @param {import('eslint').Rule.RuleContext} context */
const create = context => {
	const {ignore = []} = context.options[0] ?? {};
	const ignoredCommands = new Set(ignore);

	return {
		Document(node) {
			const root = getRootObject(node);

			if (!root) {
				return;
			}

			for (const member of iterateScripts(root)) {
				const script = member.value.value;
				const {firstFlag, replacement} = getScriptResult(script, ignoredCommands);

				if (!firstFlag) {
					continue;
				}

				context.report({
					node: member.value,
					messageId: MESSAGE_ID,
					data: {script: getKey(member), flag: firstFlag},
					fix: replacement === script ? undefined : fixer => fixer.replaceText(member.value, JSON.stringify(replacement)),
				});
			}
		},
	};
};

/** @type {import('eslint').Rule.RuleModule} */
const config = {
	create,
	meta: {
		type: 'suggestion',
		docs: {
			description: 'Disallow short-form flags in scripts.',
			recommended: true,
		},
		fixable: 'code',
		schema: optionsSchema({ignore: stringArraySchema}),
		messages,
		languages: ['json/json'],
	},
};

export default config;
