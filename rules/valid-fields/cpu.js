import {checkPlatformArray, platformFieldMessages} from '../utils/index.js';

// `process.arch` values. A leading `!` excludes an architecture.
const validValues = new Set([
	'arm',
	'arm64',
	'ia32',
	'loong64',
	'mips',
	'mipsel',
	'ppc64',
	'riscv64',
	's390',
	's390x',
	'x64',
]);

export const messages = platformFieldMessages('cpu');

export function * check(root) {
	yield * checkPlatformArray(root, 'cpu', validValues);
}
