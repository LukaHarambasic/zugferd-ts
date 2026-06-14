import { describe, expect, it } from "vitest";
import type { LineCalculationResult } from "../calculation/types";
import { calculateVatBreakdowns, groupByVat } from "../calculation/vat-grouper";
import type { DocumentAllowance, DocumentCharge } from "../types";

function makeLine(
	overrides: Partial<LineCalculationResult> & {
		lineTotalAmount: number;
		taxCategoryCode: string;
	},
): LineCalculationResult {
	return {
		lineId: "L1",
		grossPricePerUnit: 0,
		netPricePerUnit: 0,
		lineSubtotal: 0,
		itemAllowancesTotal: 0,
		itemChargesTotal: 0,
		isCalculationRelevant: true,
		taxRate: undefined,
		...overrides,
	};
}

describe("groupByVat", () => {
	it("single VAT group (S 19%)", () => {
		const lines = [
			makeLine({
				lineId: "L1",
				taxCategoryCode: "S",
				taxRate: 19,
				lineTotalAmount: 600,
			}),
			makeLine({
				lineId: "L2",
				taxCategoryCode: "S",
				taxRate: 19,
				lineTotalAmount: 400,
			}),
		];
		const groups = groupByVat(lines);
		expect(groups).toHaveLength(1);
		expect(groups[0]).toEqual({
			categoryCode: "S",
			ratePercent: 19,
			lineBasisAmount: 1000,
		});
	});

	it("two standard groups (S 19% + S 7%)", () => {
		const lines = [
			makeLine({
				lineId: "L1",
				taxCategoryCode: "S",
				taxRate: 19,
				lineTotalAmount: 600,
			}),
			makeLine({
				lineId: "L2",
				taxCategoryCode: "S",
				taxRate: 19,
				lineTotalAmount: 400,
			}),
			makeLine({
				lineId: "L3",
				taxCategoryCode: "S",
				taxRate: 7,
				lineTotalAmount: 500,
			}),
		];
		const groups = groupByVat(lines);
		expect(groups).toHaveLength(2);
		expect(groups[0]).toMatchObject({
			categoryCode: "S",
			ratePercent: 19,
			lineBasisAmount: 1000,
		});
		expect(groups[1]).toMatchObject({
			categoryCode: "S",
			ratePercent: 7,
			lineBasisAmount: 500,
		});
	});

	it("standard + reverse charge (S 19% + AE undefined)", () => {
		const lines = [
			makeLine({
				lineId: "L1",
				taxCategoryCode: "S",
				taxRate: 19,
				lineTotalAmount: 1000,
			}),
			makeLine({
				lineId: "L2",
				taxCategoryCode: "AE",
				taxRate: undefined,
				lineTotalAmount: 5000,
			}),
		];
		const groups = groupByVat(lines);
		expect(groups).toHaveLength(2);
		expect(groups[0]).toMatchObject({ categoryCode: "S", ratePercent: 19 });
		expect(groups[1]).toMatchObject({
			categoryCode: "AE",
			ratePercent: undefined,
		});
	});

	it("empty input", () => {
		expect(groupByVat([])).toEqual([]);
	});

	it("GROUP/INFORMATION lines are excluded", () => {
		const lines = [
			makeLine({
				lineId: "L1",
				taxCategoryCode: "S",
				taxRate: 19,
				lineTotalAmount: 400,
				isCalculationRelevant: true,
			}),
			makeLine({
				lineId: "L2",
				taxCategoryCode: "S",
				taxRate: 19,
				lineTotalAmount: 200,
				isCalculationRelevant: false,
			}),
		];
		const groups = groupByVat(lines);
		expect(groups).toHaveLength(1);
		expect(groups[0].lineBasisAmount).toBe(400);
	});
});

describe("calculateVatBreakdowns", () => {
	it("no adjustments (S 19%)", () => {
		const groups = [
			{ categoryCode: "S", ratePercent: 19, lineBasisAmount: 1000 },
		];
		const breakdowns = calculateVatBreakdowns(groups, [], []);
		expect(breakdowns).toHaveLength(1);
		expect(breakdowns[0]).toEqual({
			basisAmount: 1000,
			calculatedAmount: 190,
			categoryCode: "S",
			ratePercent: 19,
		});
	});

	it("with matching document allowance", () => {
		const groups = [
			{ categoryCode: "S", ratePercent: 19, lineBasisAmount: 1000 },
		];
		const allowances: DocumentAllowance[] = [
			{ actualAmount: 100, taxCategoryCode: "S", taxRate: 19 },
		];
		const breakdowns = calculateVatBreakdowns(groups, allowances, []);
		expect(breakdowns[0].basisAmount).toBe(900);
		expect(breakdowns[0].calculatedAmount).toBe(171);
	});

	it("with matching document charge", () => {
		const groups = [
			{ categoryCode: "S", ratePercent: 19, lineBasisAmount: 1000 },
		];
		const charges: DocumentCharge[] = [
			{ actualAmount: 50, taxCategoryCode: "S", taxRate: 19 },
		];
		const breakdowns = calculateVatBreakdowns(groups, [], charges);
		expect(breakdowns[0].basisAmount).toBe(1050);
		expect(breakdowns[0].calculatedAmount).toBe(199.5);
	});

	it("allowance for different VAT rate not applied", () => {
		const groups = [
			{ categoryCode: "S", ratePercent: 19, lineBasisAmount: 1000 },
		];
		const allowances: DocumentAllowance[] = [
			{ actualAmount: 100, taxCategoryCode: "S", taxRate: 7 },
		];
		const breakdowns = calculateVatBreakdowns(groups, allowances, []);
		expect(breakdowns[0].basisAmount).toBe(1000);
		expect(breakdowns[0].calculatedAmount).toBe(190);
	});

	it("AE group → calculatedAmount=0", () => {
		const groups = [
			{ categoryCode: "AE", ratePercent: undefined, lineBasisAmount: 5000 },
		];
		const breakdowns = calculateVatBreakdowns(groups, [], []);
		expect(breakdowns[0]).toEqual({
			basisAmount: 5000,
			calculatedAmount: 0,
			categoryCode: "AE",
			ratePercent: undefined,
		});
	});

	it("E group → calculatedAmount=0", () => {
		const groups = [
			{ categoryCode: "E", ratePercent: undefined, lineBasisAmount: 500 },
		];
		const breakdowns = calculateVatBreakdowns(groups, [], []);
		expect(breakdowns[0]).toEqual({
			basisAmount: 500,
			calculatedAmount: 0,
			categoryCode: "E",
			ratePercent: undefined,
		});
	});
});
