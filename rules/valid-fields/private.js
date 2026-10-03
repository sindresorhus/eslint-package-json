import {checkFieldType} from '../utils/index.js';

export const messages = {
	type: 'The `private` field must be a boolean.',
};

export function * check(root) {
	// A string like `"false"` is a common footgun, and npm's publish gate is truthiness, so it refuses to publish the package with `EPRIVATE` rather than publishing it. The value has to be the boolean the author meant, not a string that happens to be truthy or falsy.
	yield * checkFieldType(root, 'private', 'Boolean');
}
