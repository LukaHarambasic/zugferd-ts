import { calculateTransaction } from "../../calculation/transaction-calculator";
import { withinTolerance } from "../../utils/decimal";
import type { ValidationError } from "../errors";
import type { ValidationRule } from "../runner";

function err(ruleId: string, path: string, message: string): ValidationError {
	return { ruleId, path, message, severity: "error" };
}

const brco03: ValidationRule = (invoice) => {
	if (invoice.deliveryDate && invoice.vatDueDateTypeCode) {
		return [
			err(
				"BR-CO-03",
				"invoice.vatDueDateTypeCode",
				"BR-CO-03: Delivery date (BT-72) and VAT due date type code (BT-8) are mutually exclusive.",
			),
		];
	}
	return [];
};

const brco09: ValidationRule = (invoice) => {
	const errors: ValidationError[] = [];
	for (const [i, td] of (invoice.taxBreakdown ?? []).entries()) {
		if (td.exemptionReasonCode !== undefined) {
			if (!/^[A-Z]{2}/.test(td.exemptionReasonCode)) {
				errors.push(
					err(
						"BR-CO-09",
						`invoice.taxBreakdown[${i}].exemptionReasonCode`,
						"BR-CO-09: VAT exemption reason code must start with a 2-letter ISO 3166-1 alpha-2 country code.",
					),
				);
			}
		}
	}
	return errors;
};

const brco14: ValidationRule = (invoice) => {
	const breakdowns = invoice.taxBreakdown;
	if (!breakdowns || breakdowns.length === 0) return [];
	const stated = invoice.totals?.taxTotalAmount;
	if (stated === undefined) return [];
	const computed = breakdowns.reduce((sum, td) => sum + td.calculatedAmount, 0);
	if (!withinTolerance(computed, stated, breakdowns.length)) {
		return [
			err(
				"BR-CO-14",
				"invoice.totals.taxTotalAmount",
				"BR-CO-14: Invoice total VAT amount (BT-110) must equal the sum of VAT breakdown calculated amounts (BT-117) within tolerance.",
			),
		];
	}
	return [];
};

const brco16: ValidationRule = (invoice) => {
	const totals = invoice.totals;
	if (!totals) return [];
	const computed =
		totals.grandTotalAmount -
		(totals.totalPrepaidAmount ?? 0) +
		(totals.roundingAmount ?? 0);
	if (!withinTolerance(computed, totals.duePayableAmount, 1)) {
		return [
			err(
				"BR-CO-16",
				"invoice.totals.duePayableAmount",
				"BR-CO-16: Amount due for payment (BT-115) must equal grand total minus prepaid amount plus rounding amount within tolerance.",
			),
		];
	}
	return [];
};

const brco18: ValidationRule = (invoice) => {
	const breakdowns = invoice.taxBreakdown;
	if (!breakdowns || breakdowns.length === 0) {
		return [
			err(
				"BR-CO-18",
				"invoice.taxBreakdown",
				"BR-CO-18: Invoice must contain at least one VAT breakdown group (BG-23).",
			),
		];
	}
	return [];
};

const brco19: ValidationRule = (invoice) => {
	const period = invoice.billingPeriod;
	if (period) {
		if (!period.startDate && !period.endDate) {
			return [
				err(
					"BR-CO-19",
					"invoice.billingPeriod",
					"BR-CO-19: Billing period (BG-14) must have at least one of start date (BT-73) or end date (BT-74).",
				),
			];
		}
	}
	return [];
};

const brco21: ValidationRule = (invoice) => {
	const errors: ValidationError[] = [];
	for (const [i, a] of (invoice.allowances ?? []).entries()) {
		if (!a.reason && !a.reasonCode) {
			errors.push(
				err(
					"BR-CO-21",
					`invoice.allowances[${i}]`,
					"BR-CO-21: Document level allowance must have a reason (BT-97) or reason code (BT-98).",
				),
			);
		}
	}
	for (const [i, c] of (invoice.charges ?? []).entries()) {
		if (!c.reason && !c.reasonCode) {
			errors.push(
				err(
					"BR-CO-21",
					`invoice.charges[${i}]`,
					"BR-CO-21: Document level charge must have a reason (BT-104) or reason code (BT-105).",
				),
			);
		}
	}
	for (let i = 0; i < invoice.lines.length; i++) {
		for (const [j, a] of (invoice.lines[i].allowances ?? []).entries()) {
			if (!a.reason && !a.reasonCode) {
				errors.push(
					err(
						"BR-CO-21",
						`invoice.lines[${i}].allowances[${j}]`,
						"BR-CO-21: Line level allowance must have a reason or reason code.",
					),
				);
			}
		}
		for (const [j, c] of (invoice.lines[i].charges ?? []).entries()) {
			if (!c.reason && !c.reasonCode) {
				errors.push(
					err(
						"BR-CO-21",
						`invoice.lines[${i}].charges[${j}]`,
						"BR-CO-21: Line level charge must have a reason or reason code.",
					),
				);
			}
		}
	}
	return errors;
};

const brco25: ValidationRule = (invoice) => {
	const result = calculateTransaction(invoice);
	if (result.totals.duePayableAmount > 0) {
		const terms = invoice.paymentTerms ?? [];
		const hasDueDate = terms.some((t) => t.dueDate);
		const hasDescription = terms.some(
			(t) => t.description && t.description.length > 0,
		);
		if (!hasDueDate && !hasDescription) {
			return [
				err(
					"BR-CO-25",
					"invoice.paymentTerms",
					"BR-CO-25: Payment terms (BG-16) must include a due date or description when amount due is greater than zero.",
				),
			];
		}
	}
	return [];
};

const brco26: ValidationRule = (invoice) => {
	const seller = invoice.seller;
	const hasId = seller.id && seller.id.length > 0;
	const hasGlobalIds = seller.globalIds && seller.globalIds.length > 0;
	const hasLegalOrgId =
		seller.legalOrganization?.id && seller.legalOrganization.id.length > 0;
	const hasTaxRegistrations =
		seller.taxRegistrations && seller.taxRegistrations.length > 0;
	if (!hasId && !hasGlobalIds && !hasLegalOrgId && !hasTaxRegistrations) {
		return [
			err(
				"BR-CO-26",
				"invoice.seller",
				"BR-CO-26: Seller must have at least one identifier: ID (BT-29), global ID (BT-29), legal organization ID, or VAT registration.",
			),
		];
	}
	return [];
};

const brco27: ValidationRule = (invoice) => {
	const account = invoice.paymentMeans.payeeAccount;
	if (account?.iban && account?.proprietaryId) {
		return [
			err(
				"BR-CO-27",
				"invoice.paymentMeans.payeeAccount",
				"BR-CO-27: Payee account must not have both IBAN (BT-84) and proprietary ID simultaneously.",
			),
		];
	}
	return [];
};

export const calculationRules: ValidationRule[] = [
	brco03,
	brco09,
	brco14,
	brco16,
	brco18,
	brco19,
	brco21,
	brco25,
	brco26,
	brco27,
];
