import type { ZugferdInvoice } from "../types/invoice";
import type { MonetarySummation, TaxBreakdown } from "../types/settlement";
import { roundAmount } from "../utils/decimal";
import { calculateLine } from "./line-calculator";
import type { LineCalculationResult } from "./types";
import { calculateVatBreakdowns, groupByVat } from "./vat-grouper";

export interface TransactionCalculationResult {
	lineResults: LineCalculationResult[];
	vatBreakdowns: TaxBreakdown[];
	totals: MonetarySummation;
}

export function calculateTransaction(
	invoice: ZugferdInvoice,
): TransactionCalculationResult {
	const lineResults = invoice.lines.map(calculateLine);

	let lineTotalAmount = 0;
	for (const result of lineResults) {
		if (result.isCalculationRelevant) {
			lineTotalAmount += result.lineTotalAmount;
		}
	}

	let allowanceTotalAmount = 0;
	for (const allowance of invoice.allowances ?? []) {
		allowanceTotalAmount += allowance.actualAmount;
	}

	let chargeTotalAmount = 0;
	for (const charge of invoice.charges ?? []) {
		chargeTotalAmount += charge.actualAmount;
	}

	const taxBasisTotalAmount = roundAmount(
		lineTotalAmount - allowanceTotalAmount + chargeTotalAmount,
		2,
	);

	const groups = groupByVat(lineResults, invoice.lines);
	const vatBreakdowns = calculateVatBreakdowns(
		groups,
		invoice.allowances ?? [],
		invoice.charges ?? [],
	);

	let taxTotalAmount = 0;
	for (const breakdown of vatBreakdowns) {
		taxTotalAmount += breakdown.calculatedAmount;
	}

	const grandTotalAmount = roundAmount(taxBasisTotalAmount + taxTotalAmount, 2);

	let totalPrepaidAmount: number;
	if (invoice.totals?.totalPrepaidAmount !== undefined) {
		totalPrepaidAmount = invoice.totals.totalPrepaidAmount;
	} else if ((invoice.advancePayments ?? []).length > 0) {
		totalPrepaidAmount = 0;
		for (const payment of invoice.advancePayments ?? []) {
			totalPrepaidAmount += payment.paidAmount;
		}
	} else {
		totalPrepaidAmount = 0;
	}

	const roundingAmount = invoice.totals?.roundingAmount ?? 0;

	const duePayableAmount = roundAmount(
		grandTotalAmount - totalPrepaidAmount + roundingAmount,
		2,
	);

	const totals: MonetarySummation = {
		lineTotalAmount,
		allowanceTotalAmount:
			allowanceTotalAmount > 0 ? allowanceTotalAmount : undefined,
		chargeTotalAmount: chargeTotalAmount > 0 ? chargeTotalAmount : undefined,
		taxBasisTotalAmount,
		taxTotalAmount,
		grandTotalAmount,
		totalPrepaidAmount:
			totalPrepaidAmount !== 0 ? totalPrepaidAmount : undefined,
		roundingAmount: roundingAmount !== 0 ? roundingAmount : undefined,
		duePayableAmount,
	};

	return { lineResults, vatBreakdowns, totals };
}
