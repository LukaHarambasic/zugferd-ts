import type { ZugferdInvoice } from "../../types/invoice";
import type { ValidationError } from "../errors";

function hasMaxDecimals(value: number | undefined, maxDp: number): boolean {
	if (value === undefined) return true;
	const multiplied = value * 10 ** maxDp;
	return Math.abs(multiplied - Math.round(multiplied)) < 1e-6;
}

export function validateDecimal(invoice: ZugferdInvoice): ValidationError[] {
	const errors: ValidationError[] = [];

	function check(
		ruleId: string,
		path: string,
		value: number | undefined,
		message: string,
	): void {
		if (!hasMaxDecimals(value, 2)) {
			errors.push({ ruleId, path, message, severity: "error" });
		}
	}

	for (const [i, allowance] of (invoice.allowances ?? []).entries()) {
		check(
			"BR-DEC-01",
			`invoice.allowances[${i}].actualAmount`,
			allowance.actualAmount,
			`BR-DEC-01: Document allowance actualAmount (BT-92) at index ${i} must have at most 2 decimal places, got ${allowance.actualAmount}`,
		);
		check(
			"BR-DEC-02",
			`invoice.allowances[${i}].basisAmount`,
			allowance.basisAmount,
			`BR-DEC-02: Document allowance basisAmount (BT-93) at index ${i} must have at most 2 decimal places, got ${allowance.basisAmount}`,
		);
	}

	for (const [i, charge] of (invoice.charges ?? []).entries()) {
		check(
			"BR-DEC-05",
			`invoice.charges[${i}].actualAmount`,
			charge.actualAmount,
			`BR-DEC-05: Document charge actualAmount (BT-99) at index ${i} must have at most 2 decimal places, got ${charge.actualAmount}`,
		);
		check(
			"BR-DEC-06",
			`invoice.charges[${i}].basisAmount`,
			charge.basisAmount,
			`BR-DEC-06: Document charge basisAmount (BT-100) at index ${i} must have at most 2 decimal places, got ${charge.basisAmount}`,
		);
	}

	if (invoice.totals) {
		const t = invoice.totals;
		check(
			"BR-DEC-09",
			"invoice.totals.lineTotalAmount",
			t.lineTotalAmount,
			`BR-DEC-09: lineTotalAmount (BT-106) must have at most 2 decimal places, got ${t.lineTotalAmount}`,
		);
		check(
			"BR-DEC-10",
			"invoice.totals.allowanceTotalAmount",
			t.allowanceTotalAmount,
			`BR-DEC-10: allowanceTotalAmount (BT-107) must have at most 2 decimal places, got ${t.allowanceTotalAmount}`,
		);
		check(
			"BR-DEC-11",
			"invoice.totals.chargeTotalAmount",
			t.chargeTotalAmount,
			`BR-DEC-11: chargeTotalAmount (BT-108) must have at most 2 decimal places, got ${t.chargeTotalAmount}`,
		);
		check(
			"BR-DEC-12",
			"invoice.totals.taxBasisTotalAmount",
			t.taxBasisTotalAmount,
			`BR-DEC-12: taxBasisTotalAmount (BT-109) must have at most 2 decimal places, got ${t.taxBasisTotalAmount}`,
		);
		check(
			"BR-DEC-13",
			"invoice.totals.taxTotalAmount",
			t.taxTotalAmount,
			`BR-DEC-13: taxTotalAmount (BT-110) must have at most 2 decimal places, got ${t.taxTotalAmount}`,
		);
		check(
			"BR-DEC-14",
			"invoice.totals.taxTotalAmountCurrency",
			t.taxTotalAmountCurrency,
			`BR-DEC-14: taxTotalAmountCurrency (BT-111) must have at most 2 decimal places, got ${t.taxTotalAmountCurrency}`,
		);
		check(
			"BR-DEC-15",
			"invoice.totals.grandTotalAmount",
			t.grandTotalAmount,
			`BR-DEC-15: grandTotalAmount (BT-112) must have at most 2 decimal places, got ${t.grandTotalAmount}`,
		);
		check(
			"BR-DEC-16",
			"invoice.totals.totalPrepaidAmount",
			t.totalPrepaidAmount,
			`BR-DEC-16: totalPrepaidAmount (BT-113) must have at most 2 decimal places, got ${t.totalPrepaidAmount}`,
		);
		check(
			"BR-DEC-17",
			"invoice.totals.roundingAmount",
			t.roundingAmount,
			`BR-DEC-17: roundingAmount (BT-114) must have at most 2 decimal places, got ${t.roundingAmount}`,
		);
		check(
			"BR-DEC-18",
			"invoice.totals.duePayableAmount",
			t.duePayableAmount,
			`BR-DEC-18: duePayableAmount (BT-115) must have at most 2 decimal places, got ${t.duePayableAmount}`,
		);
	}

	for (const [i, breakdown] of (invoice.taxBreakdown ?? []).entries()) {
		check(
			"BR-DEC-19",
			`invoice.taxBreakdown[${i}].basisAmount`,
			breakdown.basisAmount,
			`BR-DEC-19: VAT breakdown basisAmount (BT-116) at index ${i} must have at most 2 decimal places, got ${breakdown.basisAmount}`,
		);
		check(
			"BR-DEC-20",
			`invoice.taxBreakdown[${i}].calculatedAmount`,
			breakdown.calculatedAmount,
			`BR-DEC-20: VAT breakdown calculatedAmount (BT-117) at index ${i} must have at most 2 decimal places, got ${breakdown.calculatedAmount}`,
		);
	}

	for (const [i, line] of invoice.lines.entries()) {
		check(
			"BR-DEC-23",
			`invoice.lines[${i}].lineTotalAmount`,
			line.lineTotalAmount,
			`BR-DEC-23: line lineTotalAmount (BT-131) at index ${i} must have at most 2 decimal places, got ${line.lineTotalAmount}`,
		);
		for (const [j, allowance] of (line.allowances ?? []).entries()) {
			check(
				"BR-DEC-24",
				`invoice.lines[${i}].allowances[${j}].actualAmount`,
				allowance.actualAmount,
				`BR-DEC-24: line allowance actualAmount (BT-136) at line ${i} allowance ${j} must have at most 2 decimal places, got ${allowance.actualAmount}`,
			);
			check(
				"BR-DEC-25",
				`invoice.lines[${i}].allowances[${j}].basisAmount`,
				allowance.basisAmount,
				`BR-DEC-25: line allowance basisAmount (BT-137) at line ${i} allowance ${j} must have at most 2 decimal places, got ${allowance.basisAmount}`,
			);
		}
		for (const [j, charge] of (line.charges ?? []).entries()) {
			check(
				"BR-DEC-26",
				`invoice.lines[${i}].charges[${j}].actualAmount`,
				charge.actualAmount,
				`BR-DEC-26: line charge actualAmount (BT-141) at line ${i} charge ${j} must have at most 2 decimal places, got ${charge.actualAmount}`,
			);
			check(
				"BR-DEC-27",
				`invoice.lines[${i}].charges[${j}].basisAmount`,
				charge.basisAmount,
				`BR-DEC-27: line charge basisAmount (BT-142) at line ${i} charge ${j} must have at most 2 decimal places, got ${charge.basisAmount}`,
			);
		}
	}

	return errors;
}
