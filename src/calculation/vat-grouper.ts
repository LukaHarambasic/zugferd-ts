import type { DocumentAllowance, DocumentCharge, TaxBreakdown } from "../types";
import type { InvoiceLine } from "../types/product";
import { roundAmount } from "../utils/decimal";
import type { LineCalculationResult } from "./types";

export interface VatGroup {
	categoryCode: string;
	ratePercent: number | undefined;
	lineBasisAmount: number;
	exemptionReason?: string;
	exemptionReasonCode?: string;
}

export function groupByVat(
	lineResults: LineCalculationResult[],
	lines?: InvoiceLine[],
): VatGroup[] {
	const map = new Map<string, VatGroup>();

	for (let i = 0; i < lineResults.length; i++) {
		const result = lineResults[i];
		if (!result.isCalculationRelevant) continue;
		const key = `${result.taxCategoryCode}|${result.taxRate ?? ""}`;
		const existing = map.get(key);
		if (existing) {
			existing.lineBasisAmount += result.lineTotalAmount;
			if (!existing.exemptionReason && lines?.[i]?.exemptionReason) {
				existing.exemptionReason = lines[i].exemptionReason;
			}
			if (!existing.exemptionReasonCode && lines?.[i]?.exemptionReasonCode) {
				existing.exemptionReasonCode = lines[i].exemptionReasonCode;
			}
		} else {
			map.set(key, {
				categoryCode: result.taxCategoryCode,
				ratePercent: result.taxRate,
				lineBasisAmount: result.lineTotalAmount,
				exemptionReason: lines?.[i]?.exemptionReason,
				exemptionReasonCode: lines?.[i]?.exemptionReasonCode,
			});
		}
	}

	return Array.from(map.values());
}

export function calculateVatBreakdowns(
	groups: VatGroup[],
	allowances: DocumentAllowance[],
	charges: DocumentCharge[],
): TaxBreakdown[] {
	return groups.map((group) => {
		let basisAmount = group.lineBasisAmount;

		for (const charge of charges) {
			if (
				charge.taxCategoryCode === group.categoryCode &&
				charge.taxRate === group.ratePercent
			) {
				basisAmount += charge.actualAmount;
			}
		}

		for (const allowance of allowances) {
			if (
				allowance.taxCategoryCode === group.categoryCode &&
				allowance.taxRate === group.ratePercent
			) {
				basisAmount -= allowance.actualAmount;
			}
		}

		basisAmount = roundAmount(basisAmount, 2);

		const taxCategories = new Set(["S", "L", "M"]);
		const calculatedAmount =
			taxCategories.has(group.categoryCode) && group.ratePercent !== undefined
				? roundAmount((basisAmount * group.ratePercent) / 100, 2)
				: 0;

		const breakdown: TaxBreakdown = {
			basisAmount,
			calculatedAmount,
			categoryCode: group.categoryCode,
			ratePercent: group.ratePercent,
		};

		if (group.exemptionReason) {
			breakdown.exemptionReason = group.exemptionReason;
		}
		if (group.exemptionReasonCode) {
			breakdown.exemptionReasonCode = group.exemptionReasonCode;
		}

		return breakdown;
	});
}
