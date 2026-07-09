import semver from 'semver';
import {
	dependencyTypes,
	getRootObject,
	iterateDependencies,
	optionsSchema,
	stringArraySchema,
} from './utils/index.js';

const MESSAGE_ID = 'dependency-version-range';
const SUGGESTION_ID = 'convert';

const messages = {
	[MESSAGE_ID]: 'Dependency `{{name}}` should use the {{range}} version range.',
	[SUGGESTION_ID]: 'Use the {{range}} version range.',
};

const rangeLabels = {
	caret: 'caret (`^`)',
	tilde: 'tilde (`~`)',
	exact: 'exact',
};

/**
Classify a simple, single-version dependency specifier, or return `undefined` for anything we can't safely convert (ranges, tags, `workspace:`, git, URLs, etc.).
*/
const classify = specifier => {
	let version = specifier;
	let style = 'exact';

	if (specifier.startsWith('^')) {
		style = 'caret';
		version = specifier.slice(1);
	} else if (specifier.startsWith('~')) {
		style = 'tilde';
		version = specifier.slice(1);
	}

	const normalized = semver.valid(version);

	if (normalized === null) {
		return undefined;
	}

	// Use the normalized version so a non-standard input like `v1.0.0` converts to a clean `^1.0.0` rather than `^v1.0.0`.
	return {style, version: normalized};
};

const toSpecifier = (range, version) => {
	switch (range) {
		case 'caret': {
			return `^${version}`;
		}

		case 'tilde': {
			return `~${version}`;
		}

		default: {
			return version;
		}
	}
};

/**
Pick the most common style among the classified dependencies, falling back to `caret` on a tie or when there is nothing to compare.
*/
const dominantStyle = classifieds => {
	const counts = {caret: 0, tilde: 0, exact: 0};

	for (const {style} of classifieds) {
		counts[style]++;
	}

	let best = 'caret';

	for (const style of ['tilde', 'exact']) {
		if (counts[style] > counts[best]) {
			best = style;
		}
	}

	return best;
};

/** @param {import('eslint').Rule.RuleContext} context */
const create = context => {
	const {
		range = 'caret',
		dependencyTypes: types = dependencyTypes,
		exceptions = [],
	} = context.options[0] ?? {};

	return {
		Document(node) {
			const root = getRootObject(node);

			if (!root) {
				return;
			}

			const entries = [];

			for (const {member, name} of iterateDependencies(root, types)) {
				if (exceptions.includes(name) || member.value.type !== 'String') {
					continue;
				}

				const classified = classify(member.value.value);

				if (classified) {
					entries.push({member, name, classified});
				}
			}

			// In `consistent` mode the target style is whichever is most common, so a single-style file is always allowed.
			const target = range === 'consistent' ? dominantStyle(entries.map(entry => entry.classified)) : range;

			for (const {member, name, classified} of entries) {
				if (classified.style === target) {
					continue;
				}

				const replacement = toSpecifier(target, classified.version);

				context.report({
					node: member.value,
					messageId: MESSAGE_ID,
					data: {name, range: rangeLabels[target]},
					suggest: [
						{
							messageId: SUGGESTION_ID,
							data: {range: rangeLabels[target]},
							fix: fixer => fixer.replaceText(member.value, JSON.stringify(replacement)),
						},
					],
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
			description: 'Enforce a consistent version range style for dependencies.',
			recommended: true,
		},
		hasSuggestions: true,
		schema: optionsSchema({
			range: {
				enum: ['caret', 'tilde', 'exact', 'consistent'],
			},
			dependencyTypes: {
				type: 'array',
				items: {
					enum: dependencyTypes,
				},
				uniqueItems: true,
			},
			exceptions: stringArraySchema,
		}),
		messages,
		languages: ['json/json'],
	},
};

export default config;
