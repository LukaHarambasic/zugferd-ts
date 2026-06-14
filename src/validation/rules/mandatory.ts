import {
	DIRECT_DEBIT_CODES,
	VALID_COUNTRY_CODES,
	VALID_CURRENCY_CODES,
	VALID_DOCUMENT_TYPE_CODES,
} from "../../codes";
import { isValidDateString } from "../../utils/date";
import type { ValidationError } from "../errors";
import type { ValidationRule } from "../runner";

function err(ruleId: string, path: string, message: string): ValidationError {
	return { ruleId, path, message, severity: "error" };
}

const brule01: ValidationRule = (invoice) => {
	if (!invoice.invoiceNumber) {
		return [
			err(
				"BR-01",
				"invoice.invoiceNumber",
				"BR-01: Invoice number (BT-1) must be present and non-empty.",
			),
		];
	}
	return [];
};

const brule02: ValidationRule = (invoice) => {
	if (!invoice.issueDate || !isValidDateString(invoice.issueDate)) {
		return [
			err(
				"BR-02",
				"invoice.issueDate",
				"BR-02: Invoice issue date (BT-2) must be present and a valid YYYYMMDD date.",
			),
		];
	}
	return [];
};

const brule03: ValidationRule = (_invoice) => [];

const brule04: ValidationRule = (invoice) => {
	if (!invoice.typeCode || !VALID_DOCUMENT_TYPE_CODES.has(invoice.typeCode)) {
		return [
			err(
				"BR-04",
				"invoice.typeCode",
				"BR-04: Invoice type code (BT-3) must be present and a valid document type code.",
			),
		];
	}
	return [];
};

const brule05: ValidationRule = (invoice) => {
	if (!invoice.currency || !VALID_CURRENCY_CODES.has(invoice.currency)) {
		return [
			err(
				"BR-05",
				"invoice.currency",
				"BR-05: Invoice currency code (BT-5) must be present and a valid ISO 4217 currency code.",
			),
		];
	}
	return [];
};

const brule06: ValidationRule = (invoice) => {
	if (!invoice.seller.name) {
		return [
			err(
				"BR-06",
				"invoice.seller.name",
				"BR-06: Seller name (BT-27) must be present and non-empty.",
			),
		];
	}
	return [];
};

const brule07: ValidationRule = (invoice) => {
	if (!invoice.buyer.name) {
		return [
			err(
				"BR-07",
				"invoice.buyer.name",
				"BR-07: Buyer name (BT-44) must be present and non-empty.",
			),
		];
	}
	return [];
};

const brule08: ValidationRule = (invoice) => {
	if (!invoice.seller.address) {
		return [
			err(
				"BR-08",
				"invoice.seller.address",
				"BR-08: Seller postal address (BG-5) must be present.",
			),
		];
	}
	return [];
};

const brule09: ValidationRule = (invoice) => {
	if (
		!invoice.seller.address?.countryCode ||
		!VALID_COUNTRY_CODES.has(invoice.seller.address.countryCode)
	) {
		return [
			err(
				"BR-09",
				"invoice.seller.address.countryCode",
				"BR-09: Seller country code (BT-40) must be present and a valid ISO 3166-1 alpha-2 code.",
			),
		];
	}
	return [];
};

const brule10: ValidationRule = (invoice) => {
	if (!invoice.buyer.address) {
		return [
			err(
				"BR-10",
				"invoice.buyer.address",
				"BR-10: Buyer postal address (BG-8) must be present.",
			),
		];
	}
	return [];
};

const brule11: ValidationRule = (invoice) => {
	if (
		!invoice.buyer.address?.countryCode ||
		!VALID_COUNTRY_CODES.has(invoice.buyer.address.countryCode)
	) {
		return [
			err(
				"BR-11",
				"invoice.buyer.address.countryCode",
				"BR-11: Buyer country code (BT-55) must be present and a valid ISO 3166-1 alpha-2 code.",
			),
		];
	}
	return [];
};

const brule12: ValidationRule = (invoice) => {
	if (
		invoice.totals === undefined ||
		invoice.totals.lineTotalAmount === undefined
	) {
		return [
			err(
				"BR-12",
				"invoice.totals.lineTotalAmount",
				"BR-12: Sum of invoice line net amount (BT-106) must be present.",
			),
		];
	}
	return [];
};

const brule13: ValidationRule = (invoice) => {
	if (
		invoice.totals === undefined ||
		invoice.totals.taxBasisTotalAmount === undefined
	) {
		return [
			err(
				"BR-13",
				"invoice.totals.taxBasisTotalAmount",
				"BR-13: Invoice total amount without VAT (BT-109) must be present.",
			),
		];
	}
	return [];
};

const brule14: ValidationRule = (invoice) => {
	if (
		invoice.totals === undefined ||
		invoice.totals.grandTotalAmount === undefined
	) {
		return [
			err(
				"BR-14",
				"invoice.totals.grandTotalAmount",
				"BR-14: Invoice total amount with VAT (BT-112) must be present.",
			),
		];
	}
	return [];
};

const brule15: ValidationRule = (invoice) => {
	if (
		invoice.totals === undefined ||
		invoice.totals.duePayableAmount === undefined
	) {
		return [
			err(
				"BR-15",
				"invoice.totals.duePayableAmount",
				"BR-15: Amount due for payment (BT-115) must be present.",
			),
		];
	}
	return [];
};

const brule16: ValidationRule = (invoice) => {
	if (!invoice.lines || invoice.lines.length === 0) {
		return [
			err(
				"BR-16",
				"invoice.lines",
				"BR-16: Invoice must contain at least one invoice line (BG-25).",
			),
		];
	}
	return [];
};

const brule18: ValidationRule = (invoice) => {
	if (
		invoice.sellerTaxRepresentative &&
		!invoice.sellerTaxRepresentative.name
	) {
		return [
			err(
				"BR-18",
				"invoice.sellerTaxRepresentative.name",
				"BR-18: Seller tax representative name (BT-62) must be non-empty when tax representative is present.",
			),
		];
	}
	return [];
};

const brule19: ValidationRule = (invoice) => {
	if (
		invoice.sellerTaxRepresentative &&
		!invoice.sellerTaxRepresentative.address
	) {
		return [
			err(
				"BR-19",
				"invoice.sellerTaxRepresentative.address",
				"BR-19: Seller tax representative postal address (BG-12) must be present when tax representative is present.",
			),
		];
	}
	return [];
};

const brule20: ValidationRule = (invoice) => {
	if (
		invoice.sellerTaxRepresentative?.address &&
		!invoice.sellerTaxRepresentative.address.countryCode
	) {
		return [
			err(
				"BR-20",
				"invoice.sellerTaxRepresentative.address.countryCode",
				"BR-20: Seller tax representative country code (BT-69) must be present when address is present.",
			),
		];
	}
	return [];
};

const brule21: ValidationRule = (invoice) => {
	const errors: ValidationError[] = [];
	for (let i = 0; i < invoice.lines.length; i++) {
		if (!invoice.lines[i].lineId) {
			errors.push(
				err(
					"BR-21",
					`invoice.lines[${i}].lineId`,
					"BR-21: Line item identifier (BT-126) must be non-empty.",
				),
			);
		}
	}
	return errors;
};

const brule24: ValidationRule = (invoice) => {
	const errors: ValidationError[] = [];
	for (let i = 0; i < invoice.lines.length; i++) {
		const line = invoice.lines[i];
		const isDetailLine =
			!line.lineStatusCode || line.lineStatusCode === "DETAIL";
		if (isDetailLine && line.lineTotalAmount === undefined) {
			errors.push(
				err(
					"BR-24",
					`invoice.lines[${i}].lineTotalAmount`,
					"BR-24: Invoice line net amount (BT-131) must be present on detail lines.",
				),
			);
		}
	}
	return errors;
};

const brule25: ValidationRule = (invoice) => {
	const errors: ValidationError[] = [];
	for (let i = 0; i < invoice.lines.length; i++) {
		if (!invoice.lines[i].product.name) {
			errors.push(
				err(
					"BR-25",
					`invoice.lines[${i}].product.name`,
					"BR-25: Line item name (BT-153) must be non-empty.",
				),
			);
		}
	}
	return errors;
};

const brule28: ValidationRule = (invoice) => {
	const errors: ValidationError[] = [];
	for (let i = 0; i < invoice.lines.length; i++) {
		const line = invoice.lines[i];
		if (line.grossPrice !== undefined && line.grossPrice.amount < 0) {
			errors.push(
				err(
					"BR-28",
					`invoice.lines[${i}].grossPrice.amount`,
					"BR-28: Item gross price (BT-148) must be non-negative.",
				),
			);
		}
	}
	return errors;
};

const brule29: ValidationRule = (invoice) => {
	const period = invoice.billingPeriod;
	if (
		period?.startDate &&
		period?.endDate &&
		period.endDate < period.startDate
	) {
		return [
			err(
				"BR-29",
				"invoice.billingPeriod",
				"BR-29: Billing period end date (BT-74) must not be before start date (BT-73).",
			),
		];
	}
	return [];
};

const brule31: ValidationRule = (invoice) => {
	const errors: ValidationError[] = [];
	for (const [i, a] of (invoice.allowances ?? []).entries()) {
		if (a.actualAmount === undefined) {
			errors.push(
				err(
					"BR-31",
					`invoice.allowances[${i}].actualAmount`,
					"BR-31: Document level allowance amount (BT-92) must be present.",
				),
			);
		}
	}
	return errors;
};

const brule32: ValidationRule = (invoice) => {
	const errors: ValidationError[] = [];
	for (const [i, a] of (invoice.allowances ?? []).entries()) {
		if (!a.taxCategoryCode) {
			errors.push(
				err(
					"BR-32",
					`invoice.allowances[${i}].taxCategoryCode`,
					"BR-32: Document level allowance VAT category code (BT-95) must be present.",
				),
			);
		}
	}
	return errors;
};

const brule33: ValidationRule = (invoice) => {
	const errors: ValidationError[] = [];
	for (const [i, a] of (invoice.allowances ?? []).entries()) {
		if (!a.reason && !a.reasonCode) {
			errors.push(
				err(
					"BR-33",
					`invoice.allowances[${i}]`,
					"BR-33: Document level allowance must have a reason (BT-97) or reason code (BT-98).",
				),
			);
		}
	}
	return errors;
};

const brule36: ValidationRule = (invoice) => {
	const errors: ValidationError[] = [];
	for (const [i, c] of (invoice.charges ?? []).entries()) {
		if (c.actualAmount === undefined) {
			errors.push(
				err(
					"BR-36",
					`invoice.charges[${i}].actualAmount`,
					"BR-36: Document level charge amount (BT-99) must be present.",
				),
			);
		}
	}
	return errors;
};

const brule37: ValidationRule = (invoice) => {
	const errors: ValidationError[] = [];
	for (const [i, c] of (invoice.charges ?? []).entries()) {
		if (!c.taxCategoryCode) {
			errors.push(
				err(
					"BR-37",
					`invoice.charges[${i}].taxCategoryCode`,
					"BR-37: Document level charge VAT category code (BT-102) must be present.",
				),
			);
		}
	}
	return errors;
};

const brule38: ValidationRule = (invoice) => {
	const errors: ValidationError[] = [];
	for (const [i, c] of (invoice.charges ?? []).entries()) {
		if (!c.reason && !c.reasonCode) {
			errors.push(
				err(
					"BR-38",
					`invoice.charges[${i}]`,
					"BR-38: Document level charge must have a reason (BT-104) or reason code (BT-105).",
				),
			);
		}
	}
	return errors;
};

const brule41: ValidationRule = (invoice) => {
	const errors: ValidationError[] = [];
	for (let i = 0; i < invoice.lines.length; i++) {
		for (const [j, a] of (invoice.lines[i].allowances ?? []).entries()) {
			if (a.actualAmount === undefined) {
				errors.push(
					err(
						"BR-41",
						`invoice.lines[${i}].allowances[${j}].actualAmount`,
						"BR-41: Invoice line allowance amount (BT-136) must be present.",
					),
				);
			}
		}
	}
	return errors;
};

const brule42: ValidationRule = (invoice) => {
	const errors: ValidationError[] = [];
	for (let i = 0; i < invoice.lines.length; i++) {
		for (const [j, a] of (invoice.lines[i].allowances ?? []).entries()) {
			if (!a.reason && !a.reasonCode) {
				errors.push(
					err(
						"BR-42",
						`invoice.lines[${i}].allowances[${j}]`,
						"BR-42: Invoice line allowance must have a reason (BT-139) or reason code (BT-140).",
					),
				);
			}
		}
	}
	return errors;
};

const brule43: ValidationRule = (invoice) => {
	const errors: ValidationError[] = [];
	for (let i = 0; i < invoice.lines.length; i++) {
		for (const [j, c] of (invoice.lines[i].charges ?? []).entries()) {
			if (c.actualAmount === undefined) {
				errors.push(
					err(
						"BR-43",
						`invoice.lines[${i}].charges[${j}].actualAmount`,
						"BR-43: Invoice line charge amount (BT-141) must be present.",
					),
				);
			}
		}
	}
	return errors;
};

const brule44: ValidationRule = (invoice) => {
	const errors: ValidationError[] = [];
	for (let i = 0; i < invoice.lines.length; i++) {
		for (const [j, c] of (invoice.lines[i].charges ?? []).entries()) {
			if (!c.reason && !c.reasonCode) {
				errors.push(
					err(
						"BR-44",
						`invoice.lines[${i}].charges[${j}]`,
						"BR-44: Invoice line charge must have a reason (BT-144) or reason code (BT-145).",
					),
				);
			}
		}
	}
	return errors;
};

const brule45: ValidationRule = (invoice) => {
	const errors: ValidationError[] = [];
	for (const [i, td] of (invoice.taxBreakdown ?? []).entries()) {
		if (td.basisAmount === undefined) {
			errors.push(
				err(
					"BR-45",
					`invoice.taxBreakdown[${i}].basisAmount`,
					"BR-45: VAT breakdown taxable amount (BT-116) must be present.",
				),
			);
		}
	}
	return errors;
};

const brule46: ValidationRule = (invoice) => {
	const errors: ValidationError[] = [];
	for (const [i, td] of (invoice.taxBreakdown ?? []).entries()) {
		if (td.calculatedAmount === undefined) {
			errors.push(
				err(
					"BR-46",
					`invoice.taxBreakdown[${i}].calculatedAmount`,
					"BR-46: VAT breakdown calculated amount (BT-117) must be present.",
				),
			);
		}
	}
	return errors;
};

const brule47: ValidationRule = (invoice) => {
	const errors: ValidationError[] = [];
	for (const [i, td] of (invoice.taxBreakdown ?? []).entries()) {
		if (!td.categoryCode) {
			errors.push(
				err(
					"BR-47",
					`invoice.taxBreakdown[${i}].categoryCode`,
					"BR-47: VAT breakdown category code (BT-118) must be present.",
				),
			);
		}
	}
	return errors;
};

const brule48: ValidationRule = (invoice) => {
	const errors: ValidationError[] = [];
	for (const [i, td] of (invoice.taxBreakdown ?? []).entries()) {
		if (td.categoryCode !== "O" && td.ratePercent === undefined) {
			errors.push(
				err(
					"BR-48",
					`invoice.taxBreakdown[${i}].ratePercent`,
					"BR-48: VAT breakdown rate (BT-119) must be present unless category code is O.",
				),
			);
		}
	}
	return errors;
};

const brule49: ValidationRule = (invoice) => {
	if (!invoice.paymentMeans.typeCode) {
		return [
			err(
				"BR-49",
				"invoice.paymentMeans.typeCode",
				"BR-49: Payment means type code (BT-81) must be present.",
			),
		];
	}
	return [];
};

const brule50: ValidationRule = (invoice) => {
	const typeCode = invoice.paymentMeans.typeCode;
	if (typeCode === "30" || typeCode === "58") {
		const account = invoice.paymentMeans.payeeAccount;
		if (!account?.iban && !account?.proprietaryId) {
			return [
				err(
					"BR-50",
					"invoice.paymentMeans.payeeAccount",
					"BR-50: Credit transfer payment must include payee IBAN (BT-84) or proprietary account identifier.",
				),
			];
		}
	}
	return [];
};

const brule52: ValidationRule = (invoice) => {
	const errors: ValidationError[] = [];
	for (const [i, doc] of (invoice.supportingDocuments ?? []).entries()) {
		if (!doc.id) {
			errors.push(
				err(
					"BR-52",
					`invoice.supportingDocuments[${i}].id`,
					"BR-52: Supporting document reference (BT-122) must be non-empty.",
				),
			);
		}
	}
	return errors;
};

const brule54: ValidationRule = (invoice) => {
	const errors: ValidationError[] = [];
	for (let i = 0; i < invoice.lines.length; i++) {
		for (const [j, attr] of (
			invoice.lines[i].product.attributes ?? []
		).entries()) {
			if (!attr.name || !attr.value) {
				errors.push(
					err(
						"BR-54",
						`invoice.lines[${i}].product.attributes[${j}]`,
						"BR-54: Item attribute name (BT-160) and value (BT-161) must both be non-empty.",
					),
				);
			}
		}
	}
	return errors;
};

const brule55: ValidationRule = (invoice) => {
	const errors: ValidationError[] = [];
	for (const [i, pi] of (invoice.precedingInvoices ?? []).entries()) {
		if (!pi.reference) {
			errors.push(
				err(
					"BR-55",
					`invoice.precedingInvoices[${i}].reference`,
					"BR-55: Preceding invoice reference (BT-25) must be non-empty.",
				),
			);
		}
	}
	return errors;
};

const brule56: ValidationRule = (invoice) => {
	if (invoice.sellerTaxRepresentative) {
		const vatId = invoice.sellerTaxRepresentative.vatId;
		if (!vatId) {
			return [
				err(
					"BR-56",
					"invoice.sellerTaxRepresentative.vatId",
					"BR-56: Seller tax representative VAT identifier (BT-63) must be present.",
				),
			];
		}
	}
	return [];
};

const brule57: ValidationRule = (invoice) => {
	if (invoice.shipTo?.address && !invoice.shipTo.address.countryCode) {
		return [
			err(
				"BR-57",
				"invoice.shipTo.address.countryCode",
				"BR-57: Ship-to country code (BT-80) must be present when ship-to address is present.",
			),
		];
	}
	return [];
};

const brule62: ValidationRule = (invoice) => {
	if (
		invoice.seller.electronicAddress &&
		!invoice.seller.electronicAddress.schemeId
	) {
		return [
			err(
				"BR-62",
				"invoice.seller.electronicAddress.schemeId",
				"BR-62: Seller electronic address scheme identifier (BT-34-1) must be non-empty.",
			),
		];
	}
	return [];
};

const brule63: ValidationRule = (invoice) => {
	if (
		invoice.buyer.electronicAddress &&
		!invoice.buyer.electronicAddress.schemeId
	) {
		return [
			err(
				"BR-63",
				"invoice.buyer.electronicAddress.schemeId",
				"BR-63: Buyer electronic address scheme identifier (BT-49-1) must be non-empty.",
			),
		];
	}
	return [];
};

const brule64: ValidationRule = (invoice) => {
	const errors: ValidationError[] = [];
	for (let i = 0; i < invoice.lines.length; i++) {
		const gid = invoice.lines[i].product.globalId;
		if (gid !== undefined && !gid.schemeId) {
			errors.push(
				err(
					"BR-64",
					`invoice.lines[${i}].product.globalId.schemeId`,
					"BR-64: Item standard identifier scheme identifier (BT-157-1) must be non-empty when global ID is present.",
				),
			);
		}
	}
	return errors;
};

const brule65: ValidationRule = (invoice) => {
	const errors: ValidationError[] = [];
	for (let i = 0; i < invoice.lines.length; i++) {
		for (const [j, cls] of (
			invoice.lines[i].product.classifications ?? []
		).entries()) {
			if (!cls.listId) {
				errors.push(
					err(
						"BR-65",
						`invoice.lines[${i}].product.classifications[${j}].listId`,
						"BR-65: Item classification identifier list ID (BT-158-1) must be non-empty.",
					),
				);
			}
		}
	}
	return errors;
};

const brule22: ValidationRule = (invoice) => {
	const errors: ValidationError[] = [];
	for (let i = 0; i < invoice.lines.length; i++) {
		const line = invoice.lines[i];
		if (!Number.isFinite(line.quantity)) {
			errors.push(
				err(
					"BR-22",
					`invoice.lines[${i}].quantity`,
					`BR-22: Line "${line.lineId}" quantity (BT-129) must be a finite number, got ${line.quantity}. Fix: provide a numeric quantity such as 1, 5.5, or 100.`,
				),
			);
		}
	}
	return errors;
};

const brule23: ValidationRule = (invoice) => {
	const errors: ValidationError[] = [];
	for (let i = 0; i < invoice.lines.length; i++) {
		const line = invoice.lines[i];
		if (!line.unitCode) {
			errors.push(
				err(
					"BR-23",
					`invoice.lines[${i}].unitCode`,
					`BR-23: Line "${line.lineId}" unit of measure code (BT-130) must be non-empty. Common values: H87 (piece), C62 (one), HUR (hour), DAY (day), KGM (kilogram), MTR (metre), LS (lump sum).`,
				),
			);
		}
	}
	return errors;
};

const brule26: ValidationRule = (invoice) => {
	const errors: ValidationError[] = [];
	for (let i = 0; i < invoice.lines.length; i++) {
		const line = invoice.lines[i];
		if (!Number.isFinite(line.netPrice)) {
			errors.push(
				err(
					"BR-26",
					`invoice.lines[${i}].netPrice`,
					`BR-26: Line "${line.lineId}" net price (BT-146) must be a finite number, got ${line.netPrice}. Fix: provide a valid price such as 28.50.`,
				),
			);
		}
	}
	return errors;
};

const brule27: ValidationRule = (invoice) => {
	const errors: ValidationError[] = [];
	for (let i = 0; i < invoice.lines.length; i++) {
		const line = invoice.lines[i];
		if (Number.isFinite(line.netPrice) && line.netPrice < 0) {
			errors.push(
				err(
					"BR-27",
					`invoice.lines[${i}].netPrice`,
					`BR-27: Line "${line.lineId}" net price (BT-146) must be non-negative, got ${line.netPrice}. Fix: use a positive value or zero.`,
				),
			);
		}
	}
	return errors;
};

const brule51: ValidationRule = (invoice) => {
	if (DIRECT_DEBIT_CODES.has(invoice.paymentMeans.typeCode)) {
		const account = invoice.paymentMeans.payerAccount;
		if (!account?.mandateReference) {
			return [
				err(
					"BR-51",
					"invoice.paymentMeans.payerAccount.mandateReference",
					`BR-51: SEPA direct debit (payment means type code ${invoice.paymentMeans.typeCode}) requires a mandate reference (BT-89). Fix: provide the creditor's mandate ID in payerAccount.mandateReference.`,
				),
			];
		}
	}
	return [];
};

const brule53: ValidationRule = (invoice) => {
	const errors: ValidationError[] = [];
	for (const [i, doc] of (invoice.supportingDocuments ?? []).entries()) {
		if (doc.content !== undefined) {
			if (!doc.mimeCode) {
				errors.push(
					err(
						"BR-53",
						`invoice.supportingDocuments[${i}].mimeCode`,
						`BR-53: Supporting document "${doc.id}" has embedded content but mimeCode (BT-125-1) is missing. Fix: provide a MIME type such as "application/pdf" or "image/png".`,
					),
				);
			}
			if (!doc.filename) {
				errors.push(
					err(
						"BR-53",
						`invoice.supportingDocuments[${i}].filename`,
						`BR-53: Supporting document "${doc.id}" has embedded content but filename (BT-125-2) is missing. Fix: provide a filename such as "receipt.pdf".`,
					),
				);
			}
		}
	}
	return errors;
};

export const mandatoryRules: ValidationRule[] = [
	brule01,
	brule02,
	brule03,
	brule04,
	brule05,
	brule06,
	brule07,
	brule08,
	brule09,
	brule10,
	brule11,
	brule12,
	brule13,
	brule14,
	brule15,
	brule16,
	brule18,
	brule19,
	brule20,
	brule21,
	brule22,
	brule23,
	brule24,
	brule25,
	brule26,
	brule27,
	brule28,
	brule29,
	brule31,
	brule32,
	brule33,
	brule36,
	brule37,
	brule38,
	brule41,
	brule42,
	brule43,
	brule44,
	brule45,
	brule46,
	brule47,
	brule48,
	brule49,
	brule50,
	brule51,
	brule52,
	brule53,
	brule54,
	brule55,
	brule56,
	brule57,
	brule62,
	brule63,
	brule64,
	brule65,
];
