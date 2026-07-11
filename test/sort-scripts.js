import {getTester} from './utils/test.js';

const {test} = getTester(import.meta);

test.snapshot({
	valid: [
		// Missing scripts.
		'{"name": "foo"}',
		// Scripts is not an object.
		'{"scripts": "npm test"}',
		// Empty scripts object.
		'{"scripts": {}}',
		// Single script.
		'{"scripts": {"test": "node --test"}}',
		// Alphabetically sorted scripts.
		'{"scripts": {"build": "tsc", "lint": "eslint", "test": "node --test"}}',
		// Lifecycle and colon-qualified scripts sorted alphabetically.
		'{"scripts": {"build": "tsc", "build:watch": "tsc --watch", "postbuild": "echo done", "prebuild": "echo start"}}',
	],
	invalid: [
		// Ordinary script names.
		'{"scripts": {"test": "node --test", "build": "tsc", "lint": "eslint"}}',
		// Lifecycle and colon-qualified script names.
		'{"scripts": {"prebuild": "echo start", "postbuild": "echo done", "build:watch": "tsc --watch", "build": "tsc"}}',
		// Multiline with tab indentation.
		'{\n\t"scripts": {\n\t\t"test": "node --test",\n\t\t"build": "tsc"\n\t}\n}',
		// Multiline with 2-space indentation.
		'{\n  "scripts": {\n    "test": "node --test",\n    "build": "tsc"\n  }\n}',
		// Single-line scripts with 2-space root indentation.
		'{\n  "scripts": {"test": "node --test", "build": "tsc"}\n}',
		// Single-line scripts with a space after the opening brace.
		'{\n  "scripts": { "test": "node --test", "build": "tsc"}\n}',
		// CRLF line endings.
		'{\r\n\t"scripts": {\r\n\t\t"test": "node --test",\r\n\t\t"build": "tsc"\r\n\t}\r\n}',
	],
});
