import spdxExpressionParse from 'spdx-expression-parse';
import {findMember} from '../utils/index.js';

export const messages = {
	invalid: '`{{license}}` is not a valid SPDX license expression.',
	type: 'The `license` field must be a string.',
	object: 'Use an SPDX license expression string instead of the deprecated `{type, url}` object.',
	convert: 'Replace with the SPDX expression string.',
};

const seeLicensePrefix = 'SEE LICENSE IN ';

const isValidSpdx = expression => {
	if (expression === 'UNLICENSED') {
		return true;
	}

	// `SEE LICENSE IN <filename>` requires an actual filename after the prefix.
	if (expression.startsWith(seeLicensePrefix)) {
		return expression.slice(seeLicensePrefix.length).trim() !== '';
	}

	try {
		spdxExpressionParse(expression);
		return true;
	} catch {
		return false;
	}
};

export function * check(root) {
	const member = findMember(root, 'license');

	if (!member) {
		return;
	}

	const {value} = member;

	if (value.type === 'Object') {
		const typeMember = findMember(value, 'type');
		const canConvert = typeMember?.value.type === 'String';

		yield {
			node: value,
			messageId: 'object',
			suggest: canConvert
				? [
					{
						messageId: 'convert',
						fix: fixer => fixer.replaceText(value, JSON.stringify(typeMember.value.value)),
					},
				]
				: [],
		};
		return;
	}

	if (value.type !== 'String') {
		yield {node: value, messageId: 'type'};
		return;
	}

	if (!isValidSpdx(value.value)) {
		yield {node: value, messageId: 'invalid', data: {license: value.value}};
	}
}
