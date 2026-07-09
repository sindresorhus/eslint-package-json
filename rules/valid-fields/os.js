import {checkPlatformArray, platformFieldMessages} from '../utils/index.js';

// `process.platform` values. A leading `!` excludes a platform.
const validValues = new Set([
	'aix',
	'android',
	'darwin',
	'freebsd',
	'linux',
	'openbsd',
	'sunos',
	'win32',
]);

export const messages = platformFieldMessages('os');

export function * check(root) {
	yield * checkPlatformArray(root, 'os', validValues);
}
