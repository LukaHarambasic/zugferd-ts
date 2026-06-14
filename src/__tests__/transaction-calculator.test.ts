import { describe, expect, it } from "vitest";
import { calculateTransaction } from "../calculation/transaction-calculator";
import type { ZugferdInvoice } from "../types";

function makeInvoice(overrides: Partial<ZugferdInvoice>): ZugferdInvoice {
	return {
		invoiceNumber: "TEST-001",
		issueDate: "20240101",
		typeCode: "380",
		currency: "EUR",
		seller: {
			name: "Seller GmbH",
			address: { countryCode: "DE" },
			taxRegistrations: [{ id: "DE123456789", schemeId: "VA" }],
		},
		buyer: {
			name: "Buyer AG",
			address: { countryCode: "DE" },
		},
		paymentMeans: { typeCode: "58" },
		lines: [],
		totals: {
			lineTotalAmount: 0,
			taxBasisTotalAmount: 0,
			taxTotalAmount: 0,
			grandTotalAmount: 0,
			duePayableAmount: 0,
		},
		taxBreakdown: [],
		...overrides,
	};
}

describe("calculateTransaction", () => {
	it("Abschlagsrechnung — two lines S 19%", () => {
		const invoice = makeInvoice({
			lines: [
				{
					lineId: "01.01",
					product: { name: "Service A" },
					quantity: 7,
					unitCode: "HUR",
					netPrice: 300,
					taxCategoryCode: "S",
					taxRate: 19,
				},
				{
					lineId: "01.02",
					product: { name: "Service B" },
					quantity: 6,
					unitCode: "HUR",
					netPrice: 250,
					taxCategoryCode: "S",
					taxRate: 19,
				},
			],
		});
		const result = calculateTransaction(invoice);
		expect(result.totals.lineTotalAmount).toBe(3600);
		expect(result.totals.allowanceTotalAmount).toBeUndefined();
		expect(result.totals.chargeTotalAmount).toBeUndefined();
		expect(result.totals.taxBasisTotalAmount).toBe(3600);
		expect(result.vatBreakdowns).toHaveLength(1);
		expect(result.vatBreakdowns[0].basisAmount).toBe(3600);
		expect(result.vatBreakdowns[0].calculatedAmount).toBe(684);
		expect(result.totals.taxTotalAmount).toBe(684);
		expect(result.totals.grandTotalAmount).toBe(4284);
		expect(result.totals.totalPrepaidAmount).toBeUndefined();
		expect(result.totals.duePayableAmount).toBe(4284);
	});

	it("Schlussrechnung — seven lines S 19% with advance payments", () => {
		const invoice = makeInvoice({
			lines: [1000, 2000, 3000, 2500, 2000, 1500, 2100].map((amt, i) => ({
				lineId: `L${i + 1}`,
				product: { name: `Item ${i + 1}` },
				quantity: 1,
				unitCode: "C62",
				netPrice: amt,
				taxCategoryCode: "S",
				taxRate: 19,
			})),
			advancePayments: [{ paidAmount: 4284 }, { paidAmount: 5716 }],
			totals: {
				lineTotalAmount: 0,
				taxBasisTotalAmount: 0,
				taxTotalAmount: 0,
				grandTotalAmount: 0,
				duePayableAmount: 0,
			},
		});
		const result = calculateTransaction(invoice);
		expect(result.totals.lineTotalAmount).toBe(14100);
		expect(result.totals.taxBasisTotalAmount).toBe(14100);
		expect(result.vatBreakdowns[0].calculatedAmount).toBe(2679);
		expect(result.totals.taxTotalAmount).toBe(2679);
		expect(result.totals.grandTotalAmount).toBe(16779);
		expect(result.totals.totalPrepaidAmount).toBe(10000);
		expect(result.totals.duePayableAmount).toBe(6779);
	});

	it("Multi-rate VAT (S 19% + S 7%)", () => {
		const invoice = makeInvoice({
			lines: [
				{
					lineId: "A",
					product: { name: "A" },
					quantity: 1,
					unitCode: "C62",
					netPrice: 600,
					taxCategoryCode: "S",
					taxRate: 19,
				},
				{
					lineId: "B",
					product: { name: "B" },
					quantity: 1,
					unitCode: "C62",
					netPrice: 400,
					taxCategoryCode: "S",
					taxRate: 19,
				},
				{
					lineId: "C",
					product: { name: "C" },
					quantity: 1,
					unitCode: "C62",
					netPrice: 500,
					taxCategoryCode: "S",
					taxRate: 7,
				},
			],
		});
		const result = calculateTransaction(invoice);
		expect(result.totals.lineTotalAmount).toBe(1500);
		expect(result.vatBreakdowns).toHaveLength(2);
		const s19 = result.vatBreakdowns.find((b) => b.ratePercent === 19);
		const s7 = result.vatBreakdowns.find((b) => b.ratePercent === 7);
		expect(s19?.basisAmount).toBe(1000);
		expect(s19?.calculatedAmount).toBe(190);
		expect(s7?.basisAmount).toBe(500);
		expect(s7?.calculatedAmount).toBe(35);
		expect(result.totals.taxTotalAmount).toBe(225);
		expect(result.totals.grandTotalAmount).toBe(1725);
		expect(result.totals.duePayableAmount).toBe(1725);
	});

	it("Reverse charge (AE)", () => {
		const invoice = makeInvoice({
			lines: [
				{
					lineId: "L1",
					product: { name: "Construction" },
					quantity: 1,
					unitCode: "C62",
					netPrice: 5000,
					taxCategoryCode: "AE",
					taxRate: undefined,
				},
			],
		});
		const result = calculateTransaction(invoice);
		expect(result.vatBreakdowns[0].categoryCode).toBe("AE");
		expect(result.vatBreakdowns[0].calculatedAmount).toBe(0);
		expect(result.totals.taxTotalAmount).toBe(0);
		expect(result.totals.grandTotalAmount).toBe(5000);
		expect(result.totals.duePayableAmount).toBe(5000);
	});

	it("Kleinunternehmer (E)", () => {
		const invoice = makeInvoice({
			lines: [
				{
					lineId: "L1",
					product: { name: "Service" },
					quantity: 1,
					unitCode: "C62",
					netPrice: 800,
					taxCategoryCode: "E",
					taxRate: undefined,
				},
			],
		});
		const result = calculateTransaction(invoice);
		expect(result.vatBreakdowns[0].categoryCode).toBe("E");
		expect(result.vatBreakdowns[0].calculatedAmount).toBe(0);
		expect(result.totals.taxTotalAmount).toBe(0);
		expect(result.totals.grandTotalAmount).toBe(800);
		expect(result.totals.duePayableAmount).toBe(800);
	});

	it("Document-level allowance", () => {
		const invoice = makeInvoice({
			lines: [
				{
					lineId: "L1",
					product: { name: "Service" },
					quantity: 1,
					unitCode: "C62",
					netPrice: 1000,
					taxCategoryCode: "S",
					taxRate: 19,
				},
			],
			allowances: [{ actualAmount: 100, taxCategoryCode: "S", taxRate: 19 }],
		});
		const result = calculateTransaction(invoice);
		expect(result.totals.lineTotalAmount).toBe(1000);
		expect(result.totals.allowanceTotalAmount).toBe(100);
		expect(result.totals.taxBasisTotalAmount).toBe(900);
		const bd = result.vatBreakdowns[0];
		expect(bd.basisAmount).toBe(900);
		expect(bd.calculatedAmount).toBe(171);
		expect(result.totals.taxTotalAmount).toBe(171);
		expect(result.totals.grandTotalAmount).toBe(1071);
		expect(result.totals.duePayableAmount).toBe(1071);
	});

	it("Document-level charge", () => {
		const invoice = makeInvoice({
			lines: [
				{
					lineId: "L1",
					product: { name: "Service" },
					quantity: 1,
					unitCode: "C62",
					netPrice: 1000,
					taxCategoryCode: "S",
					taxRate: 19,
				},
			],
			charges: [{ actualAmount: 50, taxCategoryCode: "S", taxRate: 19 }],
		});
		const result = calculateTransaction(invoice);
		expect(result.totals.lineTotalAmount).toBe(1000);
		expect(result.totals.chargeTotalAmount).toBe(50);
		expect(result.totals.taxBasisTotalAmount).toBe(1050);
		const bd = result.vatBreakdowns[0];
		expect(bd.basisAmount).toBe(1050);
		expect(bd.calculatedAmount).toBe(199.5);
		expect(result.totals.taxTotalAmount).toBe(199.5);
		expect(result.totals.grandTotalAmount).toBe(1249.5);
		expect(result.totals.duePayableAmount).toBe(1249.5);
	});

	it("Mixed document allowance + charge", () => {
		const invoice = makeInvoice({
			lines: [1, 2, 3].map((i) => ({
				lineId: `L${i}`,
				product: { name: `Item ${i}` },
				quantity: 1,
				unitCode: "C62",
				netPrice: 3,
				taxCategoryCode: "S",
				taxRate: 19,
			})),
			charges: [{ actualAmount: 0.5, taxCategoryCode: "S", taxRate: 19 }],
			allowances: [{ actualAmount: 0.2, taxCategoryCode: "S", taxRate: 19 }],
		});
		const result = calculateTransaction(invoice);
		expect(result.totals.lineTotalAmount).toBe(9);
		expect(result.totals.allowanceTotalAmount).toBe(0.2);
		expect(result.totals.chargeTotalAmount).toBe(0.5);
		expect(result.totals.taxBasisTotalAmount).toBe(9.3);
		const bd = result.vatBreakdowns[0];
		expect(bd.basisAmount).toBe(9.3);
		expect(bd.calculatedAmount).toBe(1.77);
		expect(result.totals.taxTotalAmount).toBe(1.77);
		expect(result.totals.grandTotalAmount).toBe(11.07);
		expect(result.totals.duePayableAmount).toBe(11.07);
	});

	it("Prepaid via advance payments", () => {
		const invoice = makeInvoice({
			lines: [
				{
					lineId: "L1",
					product: { name: "Service" },
					quantity: 1,
					unitCode: "C62",
					netPrice: 5000,
					taxCategoryCode: "S",
					taxRate: 19,
				},
			],
			advancePayments: [{ paidAmount: 1000 }, { paidAmount: 2000 }],
			totals: {
				lineTotalAmount: 0,
				taxBasisTotalAmount: 0,
				taxTotalAmount: 0,
				grandTotalAmount: 0,
				duePayableAmount: 0,
			},
		});
		const result = calculateTransaction(invoice);
		expect(result.totals.totalPrepaidAmount).toBe(3000);
		expect(result.totals.duePayableAmount).toBe(2950);
	});

	it("Prepaid via invoice.totals.totalPrepaidAmount takes precedence", () => {
		const invoice = makeInvoice({
			lines: [
				{
					lineId: "L1",
					product: { name: "Service" },
					quantity: 1,
					unitCode: "C62",
					netPrice: 5000,
					taxCategoryCode: "S",
					taxRate: 19,
				},
			],
			advancePayments: [{ paidAmount: 1000 }, { paidAmount: 2000 }],
			totals: {
				lineTotalAmount: 0,
				taxBasisTotalAmount: 0,
				taxTotalAmount: 0,
				grandTotalAmount: 0,
				duePayableAmount: 0,
				totalPrepaidAmount: 4000,
			},
		});
		const result = calculateTransaction(invoice);
		expect(result.totals.totalPrepaidAmount).toBe(4000);
		expect(result.totals.duePayableAmount).toBe(1950);
	});

	it("Foreign currency (USD) — same arithmetic as Abschlagsrechnung", () => {
		const invoice = makeInvoice({
			currency: "USD",
			lines: [
				{
					lineId: "01.01",
					product: { name: "Service A" },
					quantity: 7,
					unitCode: "HUR",
					netPrice: 300,
					taxCategoryCode: "S",
					taxRate: 19,
				},
				{
					lineId: "01.02",
					product: { name: "Service B" },
					quantity: 6,
					unitCode: "HUR",
					netPrice: 250,
					taxCategoryCode: "S",
					taxRate: 19,
				},
			],
		});
		const result = calculateTransaction(invoice);
		expect(result.totals.lineTotalAmount).toBe(3600);
		expect(result.totals.taxBasisTotalAmount).toBe(3600);
		expect(result.totals.taxTotalAmount).toBe(684);
		expect(result.totals.grandTotalAmount).toBe(4284);
		expect(result.totals.duePayableAmount).toBe(4284);
	});

	it("Rounding amount", () => {
		const invoice = makeInvoice({
			lines: [
				{
					lineId: "L1",
					product: { name: "Service" },
					quantity: 1,
					unitCode: "C62",
					netPrice: 100,
					taxCategoryCode: "S",
					taxRate: 19,
				},
			],
			totals: {
				lineTotalAmount: 0,
				taxBasisTotalAmount: 0,
				taxTotalAmount: 0,
				grandTotalAmount: 0,
				duePayableAmount: 0,
				roundingAmount: -0.03,
			},
		});
		const result = calculateTransaction(invoice);
		expect(result.totals.roundingAmount).toBe(-0.03);
		expect(result.totals.duePayableAmount).toBe(118.97);
	});

	it("GROUP and INFORMATION lines excluded", () => {
		const invoice = makeInvoice({
			lines: [
				{
					lineId: "L1",
					lineStatusCode: "GROUP",
					product: { name: "Group header" },
					quantity: 0,
					unitCode: "C62",
					netPrice: 0,
					taxCategoryCode: "S",
					taxRate: 19,
				},
				{
					lineId: "L1.1",
					lineStatusCode: "DETAIL",
					product: { name: "Detail" },
					quantity: 1,
					unitCode: "C62",
					netPrice: 400,
					taxCategoryCode: "S",
					taxRate: 19,
				},
				{
					lineId: "L1.2",
					lineStatusCode: "INFORMATION",
					product: { name: "Info" },
					quantity: 1,
					unitCode: "C62",
					netPrice: 100,
					taxCategoryCode: "S",
					taxRate: 19,
				},
			],
		});
		const result = calculateTransaction(invoice);
		expect(result.totals.lineTotalAmount).toBe(400);
		expect(result.vatBreakdowns[0].basisAmount).toBe(400);
		expect(result.totals.grandTotalAmount).toBe(476);
	});
});
