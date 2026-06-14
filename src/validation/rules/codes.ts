import {
	VALID_ALLOWANCE_REASON_CODES,
	VALID_CHARGE_REASON_CODES,
	VALID_ELECTRONIC_ADDRESS_SCHEME_IDS,
	VALID_NOTE_SUBJECT_CODES,
	VALID_PARTY_SCHEME_IDS,
	VALID_PAYMENT_MEANS_CODES,
	VALID_TAX_SCHEME_IDS,
	VALID_UNIT_CODES,
	VALID_VAT_CATEGORY_CODES,
} from "../../codes";
import type { ValidationError } from "../errors";
import type { ValidationRule } from "../runner";

function err(ruleId: string, path: string, message: string): ValidationError {
	return { ruleId, path, message, severity: "error" };
}

const inputCode01: ValidationRule = (invoice) => {
	if (!VALID_PAYMENT_MEANS_CODES.has(invoice.paymentMeans.typeCode)) {
		return [
			err(
				"INPUT-CODE-01",
				"invoice.paymentMeans.typeCode",
				`INPUT-CODE-01: Payment means type code "${invoice.paymentMeans.typeCode}" is not valid (BT-81). Valid values: 10 (cash), 20 (cheque), 30 (credit transfer), 42 (bank account), 48 (card), 49 (direct debit), 57 (standing agreement), 58 (SEPA credit transfer), 59 (SEPA direct debit), 97 (clearing). Fix: use one of the listed codes.`,
			),
		];
	}
	return [];
};

const inputCode02: ValidationRule = (invoice) => {
	const errors: ValidationError[] = [];
	for (let i = 0; i < invoice.lines.length; i++) {
		const unitCode = invoice.lines[i].unitCode;
		if (!unitCode) continue;
		if (!VALID_UNIT_CODES.has(unitCode)) {
			errors.push(
				err(
					"INPUT-CODE-02",
					`invoice.lines[${i}].unitCode`,
					`INPUT-CODE-02: Unit code "${unitCode}" on line ${i} is not valid (BT-130). Valid values include: H87 (piece), C62 (unit), KGM (kilogram), MTR (metre), HUR (hour), DAY (day), LS (lump sum). Fix: use a valid UN/ECE Rec 20 unit code.`,
				),
			);
		}
	}
	return errors;
};

const inputCode03: ValidationRule = (invoice) => {
	const errors: ValidationError[] = [];
	for (let i = 0; i < invoice.lines.length; i++) {
		const code = invoice.lines[i].taxCategoryCode;
		if (!code) continue;
		if (!VALID_VAT_CATEGORY_CODES.has(code)) {
			errors.push(
				err(
					"INPUT-CODE-03",
					`invoice.lines[${i}].taxCategoryCode`,
					`INPUT-CODE-03: VAT category code "${code}" on line ${i} is not valid (BT-151). Valid values: S, Z, E, AE, K, G, O, L, M. Fix: use one of the listed codes.`,
				),
			);
		}
	}
	return errors;
};

const inputCode04: ValidationRule = (invoice) => {
	const errors: ValidationError[] = [];
	for (const [i, item] of (invoice.allowances ?? []).entries()) {
		const code = item.taxCategoryCode;
		if (!code) continue;
		if (!VALID_VAT_CATEGORY_CODES.has(code)) {
			errors.push(
				err(
					"INPUT-CODE-04",
					`invoice.allowances[${i}].taxCategoryCode`,
					`INPUT-CODE-04: VAT category code "${code}" on allowance ${i} is not valid (BT-95). Valid values: S, Z, E, AE, K, G, O, L, M. Fix: use one of the listed codes.`,
				),
			);
		}
	}
	return errors;
};

const inputCode05: ValidationRule = (invoice) => {
	const errors: ValidationError[] = [];
	for (const [i, item] of (invoice.charges ?? []).entries()) {
		const code = item.taxCategoryCode;
		if (!code) continue;
		if (!VALID_VAT_CATEGORY_CODES.has(code)) {
			errors.push(
				err(
					"INPUT-CODE-05",
					`invoice.charges[${i}].taxCategoryCode`,
					`INPUT-CODE-05: VAT category code "${code}" on charge ${i} is not valid (BT-102). Valid values: S, Z, E, AE, K, G, O, L, M. Fix: use one of the listed codes.`,
				),
			);
		}
	}
	return errors;
};

const inputCode06: ValidationRule = (invoice) => {
	const errors: ValidationError[] = [];
	for (const [i, item] of (invoice.taxBreakdown ?? []).entries()) {
		const code = item.categoryCode;
		if (!code) continue;
		if (!VALID_VAT_CATEGORY_CODES.has(code)) {
			errors.push(
				err(
					"INPUT-CODE-06",
					`invoice.taxBreakdown[${i}].categoryCode`,
					`INPUT-CODE-06: VAT category code "${code}" on tax breakdown ${i} is not valid (BT-118). Valid values: S, Z, E, AE, K, G, O, L, M. Fix: use one of the listed codes.`,
				),
			);
		}
	}
	return errors;
};

const inputCode07: ValidationRule = (invoice) => {
	const errors: ValidationError[] = [];
	for (const [i, item] of (invoice.allowances ?? []).entries()) {
		const code = item.reasonCode;
		if (!code) continue;
		if (!VALID_ALLOWANCE_REASON_CODES.has(code)) {
			errors.push(
				err(
					"INPUT-CODE-07",
					`invoice.allowances[${i}].reasonCode`,
					`INPUT-CODE-07: Allowance reason code "${code}" on allowance ${i} is not valid (BT-98). Valid values: 95, 100, 41, 42, 60, 62, 63, 64, 65, 66, 67. Fix: use one of the listed codes.`,
				),
			);
		}
	}
	return errors;
};

const inputCode08: ValidationRule = (invoice) => {
	const errors: ValidationError[] = [];
	for (const [i, item] of (invoice.charges ?? []).entries()) {
		const code = item.reasonCode;
		if (!code) continue;
		if (!VALID_CHARGE_REASON_CODES.has(code)) {
			errors.push(
				err(
					"INPUT-CODE-08",
					`invoice.charges[${i}].reasonCode`,
					`INPUT-CODE-08: Charge reason code "${code}" on charge ${i} is not valid (BT-105). Valid values: FC, FI, PC, ABL, ADJ, CG, SAC. Fix: use one of the listed codes.`,
				),
			);
		}
	}
	return errors;
};

const inputCode09: ValidationRule = (invoice) => {
	const errors: ValidationError[] = [];
	for (const [i, item] of (invoice.notes ?? []).entries()) {
		const code = item.subjectCode;
		if (!code) continue;
		if (!VALID_NOTE_SUBJECT_CODES.has(code)) {
			errors.push(
				err(
					"INPUT-CODE-09",
					`invoice.notes[${i}].subjectCode`,
					`INPUT-CODE-09: Note subject code "${code}" on note ${i} is not valid (BT-21). Valid values: ACB, REG, AAI, AAK, AAJ, TXD, CUS, PMT. Fix: use one of the listed codes.`,
				),
			);
		}
	}
	return errors;
};

const inputCode10: ValidationRule = (invoice) => {
	const errors: ValidationError[] = [];
	for (const [j, item] of (invoice.seller.taxRegistrations ?? []).entries()) {
		const schemeId = item.schemeId;
		if (!VALID_TAX_SCHEME_IDS.has(schemeId)) {
			errors.push(
				err(
					"INPUT-CODE-10",
					`invoice.seller.taxRegistrations[${j}].schemeId`,
					`INPUT-CODE-10: Seller tax registration scheme ID "${schemeId}" is not valid (BT-32-1). Valid values: VA, FC. Fix: use one of the listed codes.`,
				),
			);
		}
	}
	return errors;
};

const inputCode11: ValidationRule = (invoice) => {
	const errors: ValidationError[] = [];
	for (const [j, item] of (invoice.buyer.taxRegistrations ?? []).entries()) {
		const schemeId = item.schemeId;
		if (!VALID_TAX_SCHEME_IDS.has(schemeId)) {
			errors.push(
				err(
					"INPUT-CODE-11",
					`invoice.buyer.taxRegistrations[${j}].schemeId`,
					`INPUT-CODE-11: Buyer tax registration scheme ID "${schemeId}" is not valid (BT-48-1). Valid values: VA, FC. Fix: use one of the listed codes.`,
				),
			);
		}
	}
	return errors;
};

const inputCode12: ValidationRule = (invoice) => {
	const ea = invoice.seller.electronicAddress;
	if (!ea) return [];
	if (!ea.schemeId || !VALID_ELECTRONIC_ADDRESS_SCHEME_IDS.has(ea.schemeId)) {
		return [
			err(
				"INPUT-CODE-12",
				"invoice.seller.electronicAddress.schemeId",
				`INPUT-CODE-12: Seller electronic address scheme ID "${ea.schemeId ?? ""}" is not valid (BT-34-1). Valid values: EM (email), 0088 (GLN). Fix: use one of the listed codes.`,
			),
		];
	}
	return [];
};

const inputCode13: ValidationRule = (invoice) => {
	const ea = invoice.buyer.electronicAddress;
	if (!ea) return [];
	if (!ea.schemeId || !VALID_ELECTRONIC_ADDRESS_SCHEME_IDS.has(ea.schemeId)) {
		return [
			err(
				"INPUT-CODE-13",
				"invoice.buyer.electronicAddress.schemeId",
				`INPUT-CODE-13: Buyer electronic address scheme ID "${ea.schemeId ?? ""}" is not valid (BT-49-1). Valid values: EM (email), 0088 (GLN). Fix: use one of the listed codes.`,
			),
		];
	}
	return [];
};

const inputCode14: ValidationRule = (invoice) => {
	const errors: ValidationError[] = [];
	for (const [j, item] of (invoice.seller.globalIds ?? []).entries()) {
		const schemeId = item.schemeId;
		if (!schemeId) continue;
		if (!VALID_PARTY_SCHEME_IDS.has(schemeId)) {
			errors.push(
				err(
					"INPUT-CODE-14",
					`invoice.seller.globalIds[${j}].schemeId`,
					`INPUT-CODE-14: Seller global ID scheme ID "${schemeId}" is not valid (BT-29-1). Valid values: 0088 (GLN), 0060 (DUNS), 0002 (SIREN), 0160 (ODETTE), 0199 (LEI), 0177 (GS1). Fix: use one of the listed codes.`,
				),
			);
		}
	}
	return errors;
};

const inputCode15: ValidationRule = (invoice) => {
	const errors: ValidationError[] = [];
	for (const [j, item] of (invoice.buyer.globalIds ?? []).entries()) {
		const schemeId = item.schemeId;
		if (!schemeId) continue;
		if (!VALID_PARTY_SCHEME_IDS.has(schemeId)) {
			errors.push(
				err(
					"INPUT-CODE-15",
					`invoice.buyer.globalIds[${j}].schemeId`,
					`INPUT-CODE-15: Buyer global ID scheme ID "${schemeId}" is not valid (BT-46-1). Valid values: 0088 (GLN), 0060 (DUNS), 0002 (SIREN), 0160 (ODETTE), 0199 (LEI), 0177 (GS1). Fix: use one of the listed codes.`,
				),
			);
		}
	}
	return errors;
};

const inputCode16: ValidationRule = (invoice) => {
	const errors: ValidationError[] = [];
	for (let i = 0; i < invoice.lines.length; i++) {
		for (const [j, allowance] of (
			invoice.lines[i].allowances ?? []
		).entries()) {
			const code = allowance.reasonCode;
			if (!code) continue;
			if (!VALID_ALLOWANCE_REASON_CODES.has(code)) {
				errors.push(
					err(
						"INPUT-CODE-16",
						`invoice.lines[${i}].allowances[${j}].reasonCode`,
						`INPUT-CODE-16: Line allowance reason code "${code}" on line ${i} allowance ${j} is not valid (BT-140). Valid values: 95, 100, 41, 42, 60, 62, 63, 64, 65, 66, 67. Fix: use one of the listed codes.`,
					),
				);
			}
		}
	}
	return errors;
};

const inputCode17: ValidationRule = (invoice) => {
	const errors: ValidationError[] = [];
	for (let i = 0; i < invoice.lines.length; i++) {
		for (const [j, charge] of (invoice.lines[i].charges ?? []).entries()) {
			const code = charge.reasonCode;
			if (!code) continue;
			if (!VALID_CHARGE_REASON_CODES.has(code)) {
				errors.push(
					err(
						"INPUT-CODE-17",
						`invoice.lines[${i}].charges[${j}].reasonCode`,
						`INPUT-CODE-17: Line charge reason code "${code}" on line ${i} charge ${j} is not valid (BT-145). Valid values: FC, FI, PC, ABL, ADJ, CG, SAC. Fix: use one of the listed codes.`,
					),
				);
			}
		}
	}
	return errors;
};

export const codeRules: ValidationRule[] = [
	inputCode01,
	inputCode02,
	inputCode03,
	inputCode04,
	inputCode05,
	inputCode06,
	inputCode07,
	inputCode08,
	inputCode09,
	inputCode10,
	inputCode11,
	inputCode12,
	inputCode13,
	inputCode14,
	inputCode15,
	inputCode16,
	inputCode17,
];
