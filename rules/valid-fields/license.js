import spdxExpressionParse from 'spdx-expression-parse';
import {findMember, isFalsyValue} from '../utils/index.js';

export const messages = {
	invalid: '`{{license}}` is not a valid SPDX license expression.',
	licenseRef: '`{{license}}` names a custom license reference, which the npm license validator flags as invalid. Use an SPDX license id, `UNLICENSED`, or `SEE LICENSE IN <file>` instead.',
	type: 'The `license` field must be a string.',
	object: 'Use an SPDX license expression string instead of the deprecated `{type, url}` object.',
	convert: 'Replace with the SPDX expression string.',
};

// Npm's own license validator (`@npmcli/package-json/lib/license.js`) accepts either spelling of both markers, so this must too.
const seeLicenseInPattern = /^SEE LICEN[CS]E IN .+/u;

/**
Check whether any license id in a parsed expression is a custom `LicenseRef` or `DocumentRef`.

The SPDX grammar allows a custom license reference, but npm's license validator walks the parsed expression and does not count it as valid for a new package when it holds one. Npm only records that in a list of changes that `npm publish` never shows, so it is reported here, separately from an invalid expression.
*/
const usesLicenseRef = node => (Object.hasOwn(node, 'license')
	? node.license.startsWith('LicenseRef') || node.license.startsWith('DocumentRef')
	: usesLicenseRef(node.left) || usesLicenseRef(node.right));

const isLicenseRef = expression => {
	try {
		return usesLicenseRef(spdxExpressionParse(expression));
	} catch {
		return false;
	}
};

const isValidSpdx = expression => {
	if (expression === 'UNLICENSED' || expression === 'UNLICENCED') {
		return true;
	}

	// Npm's own test is `/^SEE LICEN[CS]E IN ./`, which any single character after the space satisfies, so
	// trailing spaces count as the filename it never looks at. The pattern asks for the same one character.
	if (seeLicenseInPattern.test(expression)) {
		return true;
	}

	try {
		spdxExpressionParse(expression);
		return true;
	} catch {
		return false;
	}
};

export function * check(root) {
	// Npm reads the license from `license || licence`, so the alias answers whenever the field is missing or its
	// value is falsy. A `license` of any other shape is truthy, so npm reads that one and the alias beside it is
	// dead weight rather than the value it validates.
	let member = findMember(root, 'license');
	const alias = findMember(root, 'licence');

	if (alias && (!member || isFalsyValue(member.value))) {
		member = alias;
	}

	if (!member) {
		return;
	}

	const {value} = member;

	if (value.type === 'Object') {
		const typeMember = findMember(value, 'type');
		// Only offer the string the rule would then accept. Offering a `type` it rejects trades the object
		// report for the invalid-expression one, which says nothing about what is wrong with the value.
		const canConvert = typeMember?.value.type === 'String' && isValidSpdx(typeMember.value.value);

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
		return;
	}

	if (isLicenseRef(value.value)) {
		yield {node: value, messageId: 'licenseRef', data: {license: value.value}};
	}
}
