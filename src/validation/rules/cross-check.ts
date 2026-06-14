import { calculateLine } from "../../calculation/line-calculator";
import { calculateTransaction } from "../../calculation/transaction-calculator";
import type { ZugferdInvoice } from "../../types";
import { roundAmount } from "../../utils/decimal";
import type { ValidationError } from "../errors";
import type { ValidationRule } from "../runner";

function makeError(
	ruleId: string,
	path: string,
	message: string,
): ValidationError {
	return { ruleId, path, message, severity: "error" };
}

function withinTolerance(a: number, b: number, tolerance: number): boolean {
	return Math.abs(a - b) <= tolerance;
}

function checkCrossFields(invoice: ZugferdInvoice): ValidationError[] {
	const errors: ValidationError[] = [];
	const { totals: computed } = calculateTransaction(invoice);
	const lineCount = invoice.lines.length;

	if (invoice.totals) {
		const stated = invoice.totals.lineTotalAmount;
		const tolerance = Math.max(0.01, 0.01 * lineCount);
		if (!withinTolerance(stated, computed.lineTotalAmount, tolerance)) {
			const diff = roundAmount(stated - computed.lineTotalAmount, 4);
			errors.push(
				makeError(
					"BR-CO-10",
					"totals.lineTotalAmount",
					`BR-CO-10: Stated line total amount ${stated} does not match computed sum of line totals ${computed.lineTotalAmount} (difference: ${diff}). The line total must equal the sum of all individual line net amounts. Fix: recalculate from your line items or set lineTotalAmount to ${computed.lineTotalAmount}.`,
				),
			);
		}
	}

	if (
		invoice.totals?.allowanceTotalAmount !== undefined &&
		(invoice.allowances?.length ?? 0) > 0
	) {
		const stated = invoice.totals.allowanceTotalAmount;
		const computedAllowanceTotal = (invoice.allowances ?? []).reduce(
			(sum, a) => sum + a.actualAmount,
			0,
		);
		if (!withinTolerance(stated, computedAllowanceTotal, 0.01)) {
			const diff = roundAmount(stated - computedAllowanceTotal, 4);
			errors.push(
				makeError(
					"BR-CO-11",
					"totals.allowanceTotalAmount",
					`BR-CO-11: Stated allowance total amount ${stated} does not match computed sum of allowances ${computedAllowanceTotal} (difference: ${diff}).`,
				),
			);
		}
	}

	if (
		invoice.totals?.chargeTotalAmount !== undefined &&
		(invoice.charges?.length ?? 0) > 0
	) {
		const stated = invoice.totals.chargeTotalAmount;
		const computedChargeTotal = (invoice.charges ?? []).reduce(
			(sum, c) => sum + c.actualAmount,
			0,
		);
		if (!withinTolerance(stated, computedChargeTotal, 0.01)) {
			const diff = roundAmount(stated - computedChargeTotal, 4);
			errors.push(
				makeError(
					"BR-CO-12",
					"totals.chargeTotalAmount",
					`BR-CO-12: Stated charge total amount ${stated} does not match computed sum of charges ${computedChargeTotal} (difference: ${diff}).`,
				),
			);
		}
	}

	if (invoice.totals) {
		const stated = invoice.totals.taxBasisTotalAmount;
		const tolerance = Math.max(0.01, 0.01 * lineCount);
		if (!withinTolerance(stated, computed.taxBasisTotalAmount, tolerance)) {
			const diff = roundAmount(stated - computed.taxBasisTotalAmount, 4);
			errors.push(
				makeError(
					"BR-CO-13",
					"totals.taxBasisTotalAmount",
					`BR-CO-13: Stated tax basis total amount ${stated} does not match computed value ${computed.taxBasisTotalAmount} (difference: ${diff}). taxBasisTotalAmount = lineTotalAmount - allowanceTotalAmount + chargeTotalAmount.`,
				),
			);
		}
	}

	if (invoice.totals) {
		const stated = invoice.totals.grandTotalAmount;
		const computedGrand = roundAmount(
			computed.taxBasisTotalAmount + computed.taxTotalAmount,
			2,
		);
		if (!withinTolerance(stated, computedGrand, 0.01)) {
			const diff = roundAmount(stated - computedGrand, 4);
			errors.push(
				makeError(
					"BR-CO-15",
					"totals.grandTotalAmount",
					`BR-CO-15: Stated grand total amount ${stated} does not match computed value ${computedGrand} (difference: ${diff}). grandTotalAmount = taxBasisTotalAmount + taxTotalAmount.`,
				),
			);
		}
	}

	for (let i = 0; i < invoice.lines.length; i++) {
		const line = invoice.lines[i];
		if (line.lineTotalAmount === undefined) continue;
		const calculatedLine = calculateLine(line);
		const stated = line.lineTotalAmount;
		const computedLineTotal = calculatedLine.lineTotalAmount;
		if (!withinTolerance(stated, computedLineTotal, 0.01)) {
			const diff = roundAmount(stated - computedLineTotal, 4);
			errors.push(
				makeError(
					"INPUT-CROSS-01",
					`lines[${i}].lineTotalAmount`,
					`INPUT-CROSS-01: Line ${line.lineId} stated lineTotalAmount ${stated} does not match computed value ${computedLineTotal} (difference: ${diff}). Calculation: ${line.quantity} × ${line.netPrice} = ${computedLineTotal}.`,
				),
			);
		}
	}

	return errors;
}

export const crossCheckRules: ValidationRule[] = [checkCrossFields];
