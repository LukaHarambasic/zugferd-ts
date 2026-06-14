import { isValidDateString } from "../../utils/date";
import type { ValidationError } from "../errors";
import type { ValidationRule } from "../runner";

const IBAN_RE = /^[A-Z]{2}\d{2}[A-Z0-9]{4,30}$/;

function err(ruleId: string, path: string, message: string): ValidationError {
	return { ruleId, path, message, severity: "error" };
}

const fmtRule01: ValidationRule = (invoice) => {
	const value = invoice.deliveryDate;
	if (value !== undefined && !isValidDateString(value)) {
		return [
			err(
				"INPUT-FMT-01",
				"invoice.deliveryDate",
				`INPUT-FMT-01: deliveryDate "${value}" is not a valid YYYYMMDD date (BT-72). Format must be exactly 8 digits: YYYYMMDD (e.g. "20240115" for January 15, 2024). Fix: ensure month is 01-12 and day is 01-31.`,
			),
		];
	}
	return [];
};

const fmtRule02: ValidationRule = (invoice) => {
	const value = invoice.billingPeriod?.startDate;
	if (value !== undefined && !isValidDateString(value)) {
		return [
			err(
				"INPUT-FMT-02",
				"invoice.billingPeriod.startDate",
				`INPUT-FMT-02: billingPeriod.startDate "${value}" is not a valid YYYYMMDD date (BT-73). Format must be exactly 8 digits: YYYYMMDD (e.g. "20240101"). Fix: ensure month is 01-12 and day is 01-31.`,
			),
		];
	}
	return [];
};

const fmtRule03: ValidationRule = (invoice) => {
	const value = invoice.billingPeriod?.endDate;
	if (value !== undefined && !isValidDateString(value)) {
		return [
			err(
				"INPUT-FMT-03",
				"invoice.billingPeriod.endDate",
				`INPUT-FMT-03: billingPeriod.endDate "${value}" is not a valid YYYYMMDD date (BT-74). Format must be exactly 8 digits: YYYYMMDD (e.g. "20240131"). Fix: ensure month is 01-12 and day is 01-31.`,
			),
		];
	}
	return [];
};

const fmtRule04: ValidationRule = (invoice) => {
	const errors: ValidationError[] = [];
	for (let i = 0; i < invoice.lines.length; i++) {
		const value = invoice.lines[i].billingPeriod?.startDate;
		if (value !== undefined && !isValidDateString(value)) {
			errors.push(
				err(
					"INPUT-FMT-04",
					`invoice.lines[${i}].billingPeriod.startDate`,
					`INPUT-FMT-04: Line ${invoice.lines[i].lineId} billingPeriod.startDate "${value}" is not a valid YYYYMMDD date. Format must be exactly 8 digits: YYYYMMDD (e.g. "20240101"). Fix: ensure month is 01-12 and day is 01-31.`,
				),
			);
		}
	}
	return errors;
};

const fmtRule05: ValidationRule = (invoice) => {
	const errors: ValidationError[] = [];
	for (let i = 0; i < invoice.lines.length; i++) {
		const value = invoice.lines[i].billingPeriod?.endDate;
		if (value !== undefined && !isValidDateString(value)) {
			errors.push(
				err(
					"INPUT-FMT-05",
					`invoice.lines[${i}].billingPeriod.endDate`,
					`INPUT-FMT-05: Line ${invoice.lines[i].lineId} billingPeriod.endDate "${value}" is not a valid YYYYMMDD date. Format must be exactly 8 digits: YYYYMMDD (e.g. "20240131"). Fix: ensure month is 01-12 and day is 01-31.`,
				),
			);
		}
	}
	return errors;
};

const fmtRule06: ValidationRule = (invoice) => {
	const errors: ValidationError[] = [];
	for (const [i, item] of (invoice.paymentTerms ?? []).entries()) {
		const value = item.dueDate;
		if (value !== undefined && !isValidDateString(value)) {
			errors.push(
				err(
					"INPUT-FMT-06",
					`invoice.paymentTerms[${i}].dueDate`,
					`INPUT-FMT-06: paymentTerms[${i}].dueDate "${value}" is not a valid YYYYMMDD date (BT-9). Format must be exactly 8 digits: YYYYMMDD (e.g. "20240215"). Fix: ensure month is 01-12 and day is 01-31.`,
				),
			);
		}
	}
	return errors;
};

const fmtRule07: ValidationRule = (invoice) => {
	const errors: ValidationError[] = [];
	for (const [i, item] of (invoice.precedingInvoices ?? []).entries()) {
		const value = item.issueDate;
		if (value !== undefined && !isValidDateString(value)) {
			errors.push(
				err(
					"INPUT-FMT-07",
					`invoice.precedingInvoices[${i}].issueDate`,
					`INPUT-FMT-07: precedingInvoices[${i}].issueDate "${value}" is not a valid YYYYMMDD date (BT-26). Format must be exactly 8 digits: YYYYMMDD (e.g. "20240101"). Fix: ensure month is 01-12 and day is 01-31.`,
				),
			);
		}
	}
	return errors;
};

const fmtRule08: ValidationRule = (invoice) => {
	const errors: ValidationError[] = [];
	for (const [i, item] of (invoice.advancePayments ?? []).entries()) {
		const value = item.receivedDate;
		if (value !== undefined && !isValidDateString(value)) {
			errors.push(
				err(
					"INPUT-FMT-08",
					`invoice.advancePayments[${i}].receivedDate`,
					`INPUT-FMT-08: advancePayments[${i}].receivedDate "${value}" is not a valid YYYYMMDD date. Format must be exactly 8 digits: YYYYMMDD (e.g. "20240101"). Fix: ensure month is 01-12 and day is 01-31.`,
				),
			);
		}
	}
	return errors;
};

const fmtRule09: ValidationRule = (invoice) => {
	const value = invoice.paymentMeans.payeeAccount?.iban;
	if (value !== undefined && !IBAN_RE.test(value)) {
		return [
			err(
				"INPUT-FMT-09",
				"invoice.paymentMeans.payeeAccount.iban",
				`INPUT-FMT-09: Payee IBAN "${value}" has an invalid format (BT-84). An IBAN must start with a 2-letter country code followed by 2 check digits and up to 30 alphanumeric characters (e.g. "DE89370400440532013000"). Fix: verify the IBAN with your bank.`,
			),
		];
	}
	return [];
};

const fmtRule10: ValidationRule = (invoice) => {
	const value = invoice.paymentMeans.payerAccount?.iban;
	if (value !== undefined && !IBAN_RE.test(value)) {
		return [
			err(
				"INPUT-FMT-10",
				"invoice.paymentMeans.payerAccount.iban",
				`INPUT-FMT-10: Payer IBAN "${value}" has an invalid format (BT-91). An IBAN must start with a 2-letter country code followed by 2 check digits and up to 30 alphanumeric characters (e.g. "DE89370400440532013000"). Fix: verify the IBAN with your bank.`,
			),
		];
	}
	return [];
};

const fmtRule11: ValidationRule = (invoice) => {
	const errors: ValidationError[] = [];
	for (let i = 0; i < invoice.lines.length; i++) {
		const line = invoice.lines[i];
		const value = line.quantity;
		if (!Number.isFinite(value)) {
			errors.push(
				err(
					"INPUT-FMT-11",
					`invoice.lines[${i}].quantity`,
					`INPUT-FMT-11: Line ${line.lineId} quantity is not a finite number — got ${value} (BT-129). Quantity must be a valid number (e.g. 1, 5.5, 100). Fix: ensure the value is numeric and not NaN, Infinity, or undefined.`,
				),
			);
		}
	}
	return errors;
};

const fmtRule12: ValidationRule = (invoice) => {
	const errors: ValidationError[] = [];
	for (let i = 0; i < invoice.lines.length; i++) {
		const line = invoice.lines[i];
		const value = line.netPrice;
		if (!Number.isFinite(value) || value < 0) {
			errors.push(
				err(
					"INPUT-FMT-12",
					`invoice.lines[${i}].netPrice`,
					`INPUT-FMT-12: Line ${line.lineId} netPrice is ${value} (BT-146). Net price must be a finite non-negative number (e.g. 28.50). Fix: ensure the price is >= 0 and not NaN or Infinity.`,
				),
			);
		}
	}
	return errors;
};

const fmtRule13: ValidationRule = (invoice) => {
	if (invoice.totals === undefined) {
		return [];
	}
	const errors: ValidationError[] = [];
	const fields = [
		"lineTotalAmount",
		"taxBasisTotalAmount",
		"taxTotalAmount",
		"grandTotalAmount",
		"duePayableAmount",
	] as const;
	for (const field of fields) {
		const value = invoice.totals[field];
		if (!Number.isFinite(value)) {
			errors.push(
				err(
					"INPUT-FMT-13",
					`invoice.totals.${field}`,
					`INPUT-FMT-13: totals.${field} is not a finite number — got ${value}. Monetary totals must be valid finite numbers. Fix: ensure the value is numeric and not NaN, Infinity, or undefined.`,
				),
			);
		}
	}
	return errors;
};

export const formatRules: ValidationRule[] = [
	fmtRule01,
	fmtRule02,
	fmtRule03,
	fmtRule04,
	fmtRule05,
	fmtRule06,
	fmtRule07,
	fmtRule08,
	fmtRule09,
	fmtRule10,
	fmtRule11,
	fmtRule12,
	fmtRule13,
];
