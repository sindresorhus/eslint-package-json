import {checkPlatformArray, platformFieldMessages} from '../utils/index.js';

// The `process.arch` values Node builds report, plus the ones published platform packages declare (`@esbuild/linux-mips64el`, and `wasm32` from the napi-rs WebAssembly packages such as `@tailwindcss/oxide-wasm32-wasi`). Node's `configure.py` maps 32-bit PowerPC to `ppc64`, so `ppc` is not one of them. A leading `!` excludes an architecture.
const validValues = new Set([
	'arm',
	'arm64',
	'ia32',
	'loong64',
	'mips',
	'mipsel',
	'mips64el',
	'ppc64',
	'riscv64',
	's390',
	's390x',
	'x64',
	'wasm32',
]);

export const messages = platformFieldMessages('cpu');

export function * check(root) {
	yield * checkPlatformArray(root, 'cpu', validValues);
}
