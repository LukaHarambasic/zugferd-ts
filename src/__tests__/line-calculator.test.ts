import { describe, expect, it } from "vitest";
import { calculateLine } from "../calculation";
import type { InvoiceLine } from "../types";

function makeLine(overrides: Partial<InvoiceLine>): InvoiceLine {
	return {
		lineId: "1",
		product: { name: "Test" },
		quantity: 1,
		unitCode: "C62",
		netPrice: 0,
		taxCategoryCode: "S",
		taxRate: 19,
		lineTotalAmount: 0,
		...overrides,
	};
}

describe("calculateLine", () => {
	describe("simple multiplication", () => {
		it("price=7.00, qty=300 → lineTotalAmount=2100.00", () => {
			const result = calculateLine(
				makeLine({ netPrice: 7, quantity: 300, unitCode: "H87" }),
			);
			expect(result.grossPricePerUnit).toBe(7);
			expect(result.netPricePerUnit).toBe(7);
			expect(result.lineSubtotal).toBe(2100);
			expect(result.lineTotalAmount).toBe(2100);
			expect(result.isCalculationRelevant).toBe(true);
		});

		it("price=6.00, qty=250 → lineTotalAmount=1500.00", () => {
			const result = calculateLine(
				makeLine({ netPrice: 6, quantity: 250, unitCode: "MTK" }),
			);
			expect(result.lineTotalAmount).toBe(1500);
		});
	});

	describe("basisQuantity", () => {
		it("price=128.49, basisQty=100, qty=50 → lineSubtotal=64.245, lineTotalAmount=64.25", () => {
			const result = calculateLine(
				makeLine({
					netPrice: 128.49,
					netPriceBasisQuantity: 100,
					quantity: 50,
					unitCode: "LTR",
				}),
			);
			expect(result.lineSubtotal).toBeCloseTo(64.245, 5);
			expect(result.lineTotalAmount).toBe(64.25);
		});
	});

	describe("product-level allowances", () => {
		it("absolute: grossPrice=500, productAllowance actualAmount=1, qty=20 → netPrice=499, lineTotalAmount=9980.00", () => {
			const result = calculateLine(
				makeLine({
					netPrice: 499,
					grossPrice: { amount: 500, allowances: [{ actualAmount: 1 }] },
					quantity: 20,
				}),
			);
			expect(result.grossPricePerUnit).toBe(500);
			expect(result.netPricePerUnit).toBe(499);
			expect(result.lineTotalAmount).toBe(9980);
		});

		it("percentage: grossPrice=15.00, productAllowance 30%, qty=27.5 → netPrice=10.50, lineTotalAmount=288.75", () => {
			const result = calculateLine(
				makeLine({
					netPrice: 10.5,
					grossPrice: { amount: 15, allowances: [{ calculationPercent: 30 }] },
					quantity: 27.5,
				}),
			);
			expect(result.grossPricePerUnit).toBe(15);
			expect(result.netPricePerUnit).toBeCloseTo(10.5, 10);
			expect(result.lineTotalAmount).toBe(288.75);
		});
	});

	describe("item-level allowances", () => {
		it("absolute: price=100, qty=5, itemAllowance actualAmount=50 → lineSubtotal=500, lineTotalAmount=450.00", () => {
			const result = calculateLine(
				makeLine({
					netPrice: 100,
					quantity: 5,
					allowances: [{ actualAmount: 50 }],
				}),
			);
			expect(result.lineSubtotal).toBe(500);
			expect(result.itemAllowancesTotal).toBe(50);
			expect(result.lineTotalAmount).toBe(450);
		});

		it("percentage: price=4.50, qty=15, itemAllowance 5% → lineSubtotal=67.50, allowance=3.38, lineTotalAmount=64.12", () => {
			const result = calculateLine(
				makeLine({
					netPrice: 4.5,
					quantity: 15,
					allowances: [{ calculationPercent: 5 }],
				}),
			);
			expect(result.lineSubtotal).toBeCloseTo(67.5, 10);
			expect(result.itemAllowancesTotal).toBe(3.38);
			expect(result.lineTotalAmount).toBe(64.12);
		});
	});

	describe("item-level charges", () => {
		it("absolute: price=100, qty=5, itemCharge actualAmount=25 → lineTotalAmount=525.00", () => {
			const result = calculateLine(
				makeLine({
					netPrice: 100,
					quantity: 5,
					charges: [{ actualAmount: 25 }],
				}),
			);
			expect(result.lineSubtotal).toBe(500);
			expect(result.itemChargesTotal).toBe(25);
			expect(result.lineTotalAmount).toBe(525);
		});

		it("percentage: price=200, basisQty=4, qty=10, itemCharge 5% → lineSubtotal=500, charge=25, lineTotalAmount=525.00", () => {
			const result = calculateLine(
				makeLine({
					netPrice: 200,
					netPriceBasisQuantity: 4,
					quantity: 10,
					charges: [{ calculationPercent: 5 }],
				}),
			);
			expect(result.lineSubtotal).toBe(500);
			expect(result.itemChargesTotal).toBe(25);
			expect(result.lineTotalAmount).toBe(525);
		});
	});

	describe("combined adjustments", () => {
		it("product allowance + item charge: grossPrice=9.50, productAllowance=1, itemCharge=10, qty=25 → lineTotalAmount=222.50", () => {
			const result = calculateLine(
				makeLine({
					netPrice: 8.5,
					grossPrice: { amount: 9.5, allowances: [{ actualAmount: 1 }] },
					quantity: 25,
					charges: [{ actualAmount: 10 }],
				}),
			);
			expect(result.grossPricePerUnit).toBe(9.5);
			expect(result.netPricePerUnit).toBe(8.5);
			expect(result.lineSubtotal).toBe(212.5);
			expect(result.itemChargesTotal).toBe(10);
			expect(result.lineTotalAmount).toBe(222.5);
		});
	});

	describe("edge cases", () => {
		it("negative quantity (credit note): price=3.57, qty=-1 → lineTotalAmount=-3.57", () => {
			const result = calculateLine(makeLine({ netPrice: 3.57, quantity: -1 }));
			expect(result.lineTotalAmount).toBe(-3.57);
		});

		it("zero quantity: price=100, qty=0 → lineTotalAmount=0.00", () => {
			const result = calculateLine(makeLine({ netPrice: 100, quantity: 0 }));
			expect(result.lineTotalAmount).toBe(0);
		});
	});

	describe("sub-invoice lines (EXTENDED)", () => {
		it("GROUP line: isCalculationRelevant=false, lineTotalAmount from line.lineTotalAmount", () => {
			const result = calculateLine(
				makeLine({
					lineStatusCode: "GROUP",
					netPrice: 0,
					quantity: 1,
					lineTotalAmount: 5000,
				}),
			);
			expect(result.isCalculationRelevant).toBe(false);
			expect(result.lineTotalAmount).toBe(5000);
			expect(result.grossPricePerUnit).toBe(0);
			expect(result.netPricePerUnit).toBe(0);
			expect(result.lineSubtotal).toBe(0);
			expect(result.itemAllowancesTotal).toBe(0);
			expect(result.itemChargesTotal).toBe(0);
		});

		it("DETAIL line: isCalculationRelevant=true, calculated normally", () => {
			const result = calculateLine(
				makeLine({
					lineStatusCode: "DETAIL",
					netPrice: 100,
					quantity: 3,
					lineTotalAmount: 0,
				}),
			);
			expect(result.isCalculationRelevant).toBe(true);
			expect(result.lineTotalAmount).toBe(300);
		});

		it("INFORMATION line: isCalculationRelevant=false, zeroed intermediates", () => {
			const result = calculateLine(
				makeLine({
					lineStatusCode: "INFORMATION",
					netPrice: 150,
					quantity: 1,
					lineTotalAmount: 150,
				}),
			);
			expect(result.isCalculationRelevant).toBe(false);
			expect(result.lineSubtotal).toBe(0);
			expect(result.itemAllowancesTotal).toBe(0);
			expect(result.itemChargesTotal).toBe(0);
		});
	});

	describe("result metadata", () => {
		it("propagates taxCategoryCode and taxRate", () => {
			const result = calculateLine(
				makeLine({
					taxCategoryCode: "AE",
					taxRate: undefined,
					netPrice: 500,
					quantity: 1,
				}),
			);
			expect(result.taxCategoryCode).toBe("AE");
			expect(result.taxRate).toBeUndefined();
		});

		it("propagates lineId", () => {
			const result = calculateLine(
				makeLine({ lineId: "42", netPrice: 1, quantity: 1 }),
			);
			expect(result.lineId).toBe("42");
		});
	});
});
