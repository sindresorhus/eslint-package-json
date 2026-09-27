import {checkPlatformArray, platformFieldMessages} from '../utils/index.js';

// The `process.platform` values Node builds report, plus the ones published platform packages declare (`@esbuild/netbsd-x64`, `@rollup/rollup-openharmony-arm64`). A leading `!` excludes a platform.
const validValues = new Set([
	'aix',
	'android',
	'cygwin',
	'darwin',
	'freebsd',
	'haiku',
	'linux',
	'netbsd',
	'openbsd',
	'openharmony',
	'sunos',
	'win32',
]);

export const messages = platformFieldMessages('os');

export function * check(root) {
	yield * checkPlatformArray(root, 'os', validValues);
}
