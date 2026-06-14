import { describe, expect, it } from "vitest";
import type { ZugferdInvoice } from "../types/invoice";
import type { InvoiceLine } from "../types/product";
import { validateDecimal } from "../validation/rules/decimal";
import { validateExtended } from "../validation/rules/extended";

function makeDetailLine(
	lineId: string,
	parentLineId: string,
	overrides: Partial<InvoiceLine> = {},
): InvoiceLine {
	return {
		lineId,
		parentLineId,
		lineStatusCode: "DETAIL",
		product: { name: "Testposition" },
		quantity: 1,
		unitCode: "C62",
		netPrice: 100,
		taxCategoryCode: "S",
		taxRate: 19,
		lineTotalAmount: 100,
		...overrides,
	};
}

function makeGroupLine(
	lineId: string,
	lineTotalAmount: number,
	overrides: Partial<InvoiceLine> = {},
): InvoiceLine {
	return {
		lineId,
		lineStatusCode: "GROUP",
		product: { name: "Gewerk" },
		quantity: 1,
		unitCode: "C62",
		netPrice: 0,
		taxCategoryCode: "S",
		taxRate: 19,
		lineTotalAmount,
		...overrides,
	};
}

function makeTotals(lineTotalAmount: number) {
	return {
		lineTotalAmount,
		taxBasisTotalAmount: lineTotalAmount,
		taxTotalAmount: Math.round(lineTotalAmount * 0.19 * 100) / 100,
		grandTotalAmount: Math.round(lineTotalAmount * 1.19 * 100) / 100,
		duePayableAmount: Math.round(lineTotalAmount * 1.19 * 100) / 100,
	};
}

function makeInvoice(lines: InvoiceLine[]): ZugferdInvoice {
	const total = lines.reduce((acc, l) => acc + (l.lineTotalAmount ?? 0), 0);
	return {
		invoiceNumber: "2026-001",
		issueDate: "20260531",
		typeCode: "380",
		currency: "EUR",
		seller: {
			name: "Testfirma GmbH",
			address: { countryCode: "DE" },
			taxRegistrations: [{ id: "DE123456789", schemeId: "VA" }],
		},
		buyer: {
			name: "Kunde AG",
			address: { countryCode: "DE" },
		},
		paymentMeans: { typeCode: "58" },
		lines,
		totals: makeTotals(total),
		taxBreakdown: [
			{
				basisAmount: total,
				calculatedAmount: Math.round(total * 0.19 * 100) / 100,
				categoryCode: "S",
				ratePercent: 19,
			},
		],
	};
}

describe("validateExtended — sub-invoice line hierarchy", () => {
	it("Test 1: valid GROUP + DETAIL hierarchy passes", () => {
		const group = makeGroupLine("1", 200);
		const child1 = makeDetailLine("1.1", "1", { lineTotalAmount: 100 });
		const child2 = makeDetailLine("1.2", "1", { lineTotalAmount: 100 });
		const errors = validateExtended(makeInvoice([group, child1, child2]));
		expect(errors).toHaveLength(0);
	});

	it("Test 2: child referencing non-existent parent fails BR-FXEXT-11", () => {
		const orphan = makeDetailLine("1.1", "999");
		const errors = validateExtended(makeInvoice([orphan]));
		expect(errors.some((e) => e.ruleId === "BR-FXEXT-11")).toBe(true);
	});

	it("Test 3: parent line missing lineStatusCode fails BR-FXEXT-06", () => {
		const bareParent: InvoiceLine = {
			lineId: "1",
			product: { name: "Gewerk" },
			quantity: 1,
			unitCode: "C62",
			netPrice: 0,
			taxCategoryCode: "S",
			lineTotalAmount: 100,
		};
		const child = makeDetailLine("1.1", "1");
		const errors = validateExtended(makeInvoice([bareParent, child]));
		expect(errors.some((e) => e.ruleId === "BR-FXEXT-06")).toBe(true);
	});

	it("Test 4: GROUP line total not matching sum of children fails BR-FXEXT-08", () => {
		const group = makeGroupLine("1", 500);
		const child = makeDetailLine("1.1", "1", { lineTotalAmount: 100 });
		const errors = validateExtended(makeInvoice([group, child]));
		expect(errors.some((e) => e.ruleId === "BR-FXEXT-08")).toBe(true);
	});

	it("Test 5: DETAIL line with NaN quantity fails BR-FXEXT-BR-22", () => {
		const line = makeDetailLine("1.1", "1", { quantity: Number.NaN });
		const group = makeGroupLine("1", line.lineTotalAmount ?? 0);
		const errors = validateExtended(makeInvoice([group, line]));
		expect(errors.some((e) => e.ruleId === "BR-FXEXT-BR-22")).toBe(true);
	});

	it("Test 6: DETAIL line with empty unitCode fails BR-FXEXT-BR-23", () => {
		const line = makeDetailLine("1.1", "1", { unitCode: "" });
		const group = makeGroupLine("1", line.lineTotalAmount ?? 0);
		const errors = validateExtended(makeInvoice([group, line]));
		expect(errors.some((e) => e.ruleId === "BR-FXEXT-BR-23")).toBe(true);
	});

	it("Test 7: DETAIL line with NaN netPrice fails BR-FXEXT-BR-26", () => {
		const line = makeDetailLine("1.1", "1", { netPrice: Number.NaN });
		const group = makeGroupLine("1", line.lineTotalAmount ?? 0);
		const errors = validateExtended(makeInvoice([group, line]));
		expect(errors.some((e) => e.ruleId === "BR-FXEXT-BR-26")).toBe(true);
	});

	it("Test 8: DETAIL line with negative netPrice fails BR-FXEXT-BR-27", () => {
		const line = makeDetailLine("1.1", "1", { netPrice: -50 });
		const group = makeGroupLine("1", line.lineTotalAmount ?? 0);
		const errors = validateExtended(makeInvoice([group, line]));
		expect(errors.some((e) => e.ruleId === "BR-FXEXT-BR-27")).toBe(true);
	});

	it("Test 9: GROUP total off by more than tolerance fails BR-FXEXT-CO-10", () => {
		const group = makeGroupLine("1", 500);
		const child = makeDetailLine("1.1", "1", { lineTotalAmount: 100 });
		const errors = validateExtended(makeInvoice([group, child]));
		expect(errors.some((e) => e.ruleId === "BR-FXEXT-CO-10")).toBe(true);
	});

	it("Test 10: invoice with no hierarchy lines returns empty array", () => {
		const flatLine: InvoiceLine = {
			lineId: "1",
			product: { name: "Beratung" },
			quantity: 1,
			unitCode: "HUR",
			netPrice: 100,
			taxCategoryCode: "S",
			taxRate: 19,
			lineTotalAmount: 100,
		};
		const errors = validateExtended(makeInvoice([flatLine]));
		expect(errors).toHaveLength(0);
	});
});

describe("validateDecimal — decimal precision rules", () => {
	it("Test 11: grandTotalAmount with 2dp passes BR-DEC-15", () => {
		const invoice = makeInvoice([
			{
				lineId: "1",
				product: { name: "Test" },
				quantity: 1,
				unitCode: "C62",
				netPrice: 100,
				taxCategoryCode: "S",
				lineTotalAmount: 100,
			},
		]);
		const t11 = invoice.totals;
		if (!t11) throw new Error("totals missing");
		t11.grandTotalAmount = 1234.56;
		const errors = validateDecimal(invoice);
		const decErrors = errors.filter((e) => e.ruleId === "BR-DEC-15");
		expect(decErrors).toHaveLength(0);
	});

	it("Test 12: grandTotalAmount with 3dp fails BR-DEC-15", () => {
		const invoice = makeInvoice([
			{
				lineId: "1",
				product: { name: "Test" },
				quantity: 1,
				unitCode: "C62",
				netPrice: 100,
				taxCategoryCode: "S",
				lineTotalAmount: 100,
			},
		]);
		const t12 = invoice.totals;
		if (!t12) throw new Error("totals missing");
		t12.grandTotalAmount = 1234.567;
		const errors = validateDecimal(invoice);
		expect(errors.some((e) => e.ruleId === "BR-DEC-15")).toBe(true);
	});

	it("Test 13: integer duePayableAmount passes BR-DEC-18", () => {
		const invoice = makeInvoice([
			{
				lineId: "1",
				product: { name: "Test" },
				quantity: 1,
				unitCode: "C62",
				netPrice: 100,
				taxCategoryCode: "S",
				lineTotalAmount: 100,
			},
		]);
		const t13 = invoice.totals;
		if (!t13) throw new Error("totals missing");
		t13.duePayableAmount = 1234;
		const errors = validateDecimal(invoice);
		const decErrors = errors.filter((e) => e.ruleId === "BR-DEC-18");
		expect(decErrors).toHaveLength(0);
	});

	it("Test 14: taxBasisTotalAmount with 1dp passes BR-DEC-12", () => {
		const invoice = makeInvoice([
			{
				lineId: "1",
				product: { name: "Test" },
				quantity: 1,
				unitCode: "C62",
				netPrice: 100,
				taxCategoryCode: "S",
				lineTotalAmount: 100,
			},
		]);
		const t14 = invoice.totals;
		if (!t14) throw new Error("totals missing");
		t14.taxBasisTotalAmount = 1234.5;
		const errors = validateDecimal(invoice);
		const decErrors = errors.filter((e) => e.ruleId === "BR-DEC-12");
		expect(decErrors).toHaveLength(0);
	});

	it("Test 15: line allowance actualAmount with 3dp fails BR-DEC-24", () => {
		const invoice = makeInvoice([
			{
				lineId: "1",
				product: { name: "Test" },
				quantity: 1,
				unitCode: "C62",
				netPrice: 100,
				taxCategoryCode: "S",
				lineTotalAmount: 100,
				allowances: [{ actualAmount: 10.123, reason: "Rabatt" }],
			},
		]);
		const errors = validateDecimal(invoice);
		expect(errors.some((e) => e.ruleId === "BR-DEC-24")).toBe(true);
	});

	it("Test 16: all amounts at exactly 2dp passes all BR-DEC rules", () => {
		const invoice = makeInvoice([
			{
				lineId: "1",
				product: { name: "Test" },
				quantity: 1,
				unitCode: "C62",
				netPrice: 100.0,
				taxCategoryCode: "S",
				lineTotalAmount: 100.0,
			},
		]);
		invoice.totals = {
			lineTotalAmount: 100.0,
			taxBasisTotalAmount: 100.0,
			taxTotalAmount: 19.0,
			grandTotalAmount: 119.0,
			duePayableAmount: 119.0,
		};
		invoice.taxBreakdown = [
			{
				basisAmount: 100.0,
				calculatedAmount: 19.0,
				categoryCode: "S",
				ratePercent: 19,
			},
		];
		const errors = validateDecimal(invoice);
		const decErrors = errors.filter((e) => e.ruleId.startsWith("BR-DEC-"));
		expect(decErrors).toHaveLength(0);
	});

	it("Test 17: 0.1 + 0.2 floating-point edge case passes BR-DEC-15", () => {
		const invoice = makeInvoice([
			{
				lineId: "1",
				product: { name: "Test" },
				quantity: 1,
				unitCode: "C62",
				netPrice: 100,
				taxCategoryCode: "S",
				lineTotalAmount: 100,
			},
		]);
		const t17 = invoice.totals;
		if (!t17) throw new Error("totals missing");
		t17.grandTotalAmount = 0.1 + 0.2;
		const errors = validateDecimal(invoice);
		const decErrors = errors.filter((e) => e.ruleId === "BR-DEC-15");
		expect(decErrors).toHaveLength(0);
	});
});
