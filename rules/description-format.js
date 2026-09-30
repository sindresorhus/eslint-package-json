import {getRootObject, findMember, optionsSchema} from './utils/index.js';

const MESSAGE_ID_UPPERCASE = 'uppercase';
const MESSAGE_ID_NO_PERIOD = 'noPeriod';
const MESSAGE_ID_PERIOD = 'period';

const messages = {
	[MESSAGE_ID_UPPERCASE]: 'Description should start with an uppercase letter.',
	[MESSAGE_ID_NO_PERIOD]: 'Description should not end with a period.',
	[MESSAGE_ID_PERIOD]: 'Description should end with a period.',
};

// A lowercase letter in any script, not just ASCII. The `u` flag makes the pattern match a whole code point.
const lowercaseLetterPattern = /^\p{Lowercase_Letter}/u;

/** @param {import('eslint').Rule.RuleContext} context */
const create = context => {
	const {startWithUppercase = true, endWithPeriod = false} = context.options[0] ?? {};

	return {
		Document(node) {
			const root = getRootObject(node);

			if (!root) {
				return;
			}

			const member = findMember(root, 'description');

			if (member?.value.type !== 'String' || member.value.value === '') {
				return;
			}

			const description = member.value.value;
			// Leading padding is as invisible in the rendered description as trailing padding, so the first letter is judged without it, and the fix takes it away.
			const sentenceStart = description.trimStart();

			if (startWithUppercase && lowercaseLetterPattern.test(sentenceStart)) {
				const report = {
					node: member.value,
					messageId: MESSAGE_ID_UPPERCASE,
				};

				// Unicode case mapping is not capitalization. `ß` uppercases to `SS` and `ﬁ` to `FI`, so a fix that used it would respell the first word rather than capitalize it, and no lowercase letter is worth respelling. Taking the code point rather than the code unit keeps a letter outside the BMP from being split into half a surrogate pair, and counting the mapping in code points rather than code units keeps a letter whose uppercase is one astral character fixable.
				const first = String.fromCodePoint(sentenceStart.codePointAt(0));
				const capitalized = first.toUpperCase();

				if ([...capitalized].length === 1 && capitalized !== first) {
					report.fix = fixer => fixer.replaceText(member.value, JSON.stringify(capitalized + sentenceStart.slice(first.length)));
				}

				context.report(report);
			}

			// The trailing space or newline is invisible in the rendered description, so the sentence is judged without it, and the fix takes it along with the periods: a value that still rendered with one would resolve this report and change nothing.
			if (endWithPeriod === false && description.trimEnd().endsWith('.')) {
				// One run of periods and whitespace, because `"My thing.  .."` leaves a run of spaces behind the periods it loses, and a value that still renders with a period would resolve this report and change nothing.
				const fixed = description.replace(/[\s.]+$/u, '');

				const report = {
					node: member.value,
					messageId: MESSAGE_ID_NO_PERIOD,
				};

				// A description made only of periods has no shorter form, and stripping them would leave an empty field rather than a period-less one. The problem is still reported, just with nothing to offer as a fix.
				if (fixed !== '') {
					report.fix = fixer => fixer.replaceText(member.value, JSON.stringify(fixed));
				}

				context.report(report);
			} else if (endWithPeriod === true && !description.trimEnd().endsWith('.')) {
				const sentence = description.trimEnd();

				// A description that is nothing but padding has no sentence to end, and a period on its own is no better than the padding, so the problem is reported with nothing to offer as a fix.
				const fix = sentence === ''
					? undefined
					: fixer => fixer.replaceText(member.value, JSON.stringify(sentence + '.'));

				context.report({
					node: member.value,
					messageId: MESSAGE_ID_PERIOD,
					fix,
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
			description: 'Enforce formatting of the `description` field.',
			recommended: false,
		},
		fixable: 'code',
		schema: optionsSchema({
			startWithUppercase: {
				type: 'boolean',
			},
			endWithPeriod: {
				type: 'boolean',
			},
		}),
		messages,
		languages: ['json/json'],
	},
};

export default config;
