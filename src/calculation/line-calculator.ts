import type { InvoiceLine } from "../types";
import { roundAmount } from "../utils/decimal";
import type { LineCalculationResult } from "./types";

export function calculateLine(line: InvoiceLine): LineCalculationResult {
	const isNonCalculating =
		line.lineStatusCode === "GROUP" || line.lineStatusCode === "INFORMATION";

	if (isNonCalculating) {
		return {
			lineId: line.lineId,
			grossPricePerUnit: 0,
			netPricePerUnit: 0,
			lineSubtotal: 0,
			itemAllowancesTotal: 0,
			itemChargesTotal: 0,
			lineTotalAmount: line.lineTotalAmount ?? 0,
			taxCategoryCode: line.taxCategoryCode,
			taxRate: line.taxRate,
			isCalculationRelevant: false,
		};
	}

	const grossPricePerUnit = line.grossPrice?.amount ?? line.netPrice;

	let productDelta = 0;
	for (const allowance of line.grossPrice?.allowances ?? []) {
		if (allowance.actualAmount !== undefined) {
			productDelta -= allowance.actualAmount;
		} else if (allowance.calculationPercent !== undefined) {
			productDelta -= (grossPricePerUnit * allowance.calculationPercent) / 100;
		}
	}
	const netPricePerUnit = grossPricePerUnit + productDelta;

	const basisQuantity = line.netPriceBasisQuantity ?? 1;
	const lineSubtotal = (netPricePerUnit * line.quantity) / basisQuantity;

	let itemAllowancesTotal = 0;
	for (const allowance of line.allowances ?? []) {
		if (allowance.actualAmount !== undefined) {
			itemAllowancesTotal += allowance.actualAmount;
		} else if (allowance.calculationPercent !== undefined) {
			itemAllowancesTotal += roundAmount(
				(lineSubtotal * allowance.calculationPercent) / 100,
				2,
			);
		}
	}

	let itemChargesTotal = 0;
	for (const charge of line.charges ?? []) {
		if (charge.actualAmount !== undefined) {
			itemChargesTotal += charge.actualAmount;
		} else if (charge.calculationPercent !== undefined) {
			itemChargesTotal += roundAmount(
				(lineSubtotal * charge.calculationPercent) / 100,
				2,
			);
		}
	}

	const lineTotalAmount = roundAmount(
		lineSubtotal - itemAllowancesTotal + itemChargesTotal,
		2,
	);

	return {
		lineId: line.lineId,
		grossPricePerUnit,
		netPricePerUnit,
		lineSubtotal,
		itemAllowancesTotal,
		itemChargesTotal,
		lineTotalAmount,
		taxCategoryCode: line.taxCategoryCode,
		taxRate: line.taxRate,
		isCalculationRelevant: true,
	};
}
