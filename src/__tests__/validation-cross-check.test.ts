import { describe, expect, it } from "vitest";
import type { ZugferdInvoice } from "../types";
import { crossCheckRules } from "../validation/rules/cross-check";
import { validate } from "../validation/runner";

function validInvoice(): ZugferdInvoice {
	return {
		invoiceNumber: "2026-001",
		issueDate: "20260601",
		typeCode: "380",
		currency: "EUR",
		seller: {
			name: "Musterbau GmbH",
			address: { countryCode: "DE" },
			taxRegistrations: [{ id: "DE123456789", schemeId: "VA" }],
		},
		buyer: {
			name: "Auftraggeber AG",
			address: { countryCode: "DE" },
		},
		paymentMeans: {
			typeCode: "58",
			payeeAccount: { iban: "DE89370400440532013000" },
		},
		lines: [
			{
				lineId: "1",
				quantity: 10,
				netPrice: 100,
				unitCode: "H87",
				taxCategoryCode: "S",
				taxRate: 19,
				lineTotalAmount: 1000,
				product: { name: "Service" },
			},
		],
		totals: {
			lineTotalAmount: 1000,
			taxBasisTotalAmount: 1000,
			taxTotalAmount: 190,
			grandTotalAmount: 1190,
			duePayableAmount: 1190,
		},
	};
}

describe("cross-check validation rules", () => {
	it("valid invoice passes all cross-checks", () => {
		const result = validate(validInvoice(), crossCheckRules);
		expect(result.errors).toEqual([]);
	});

	it("BR-CO-10: wrong lineTotalAmount", () => {
		const invoice = structuredClone(validInvoice());
		const totals = invoice.totals;
		if (!totals) throw new Error("totals missing");
		totals.lineTotalAmount = 999;
		const result = validate(invoice, crossCheckRules);
		expect(result.errors.some((e) => e.ruleId === "BR-CO-10")).toBe(true);
	});

	it("BR-CO-13: wrong taxBasisTotalAmount", () => {
		const invoice = structuredClone(validInvoice());
		const totals = invoice.totals;
		if (!totals) throw new Error("totals missing");
		totals.taxBasisTotalAmount = 500;
		const result = validate(invoice, crossCheckRules);
		expect(result.errors.some((e) => e.ruleId === "BR-CO-13")).toBe(true);
	});

	it("BR-CO-15: wrong grandTotalAmount", () => {
		const invoice = structuredClone(validInvoice());
		const totals = invoice.totals;
		if (!totals) throw new Error("totals missing");
		totals.grandTotalAmount = 9999;
		const result = validate(invoice, crossCheckRules);
		expect(result.errors.some((e) => e.ruleId === "BR-CO-15")).toBe(true);
	});

	it("INPUT-CROSS-01: wrong line lineTotalAmount", () => {
		const invoice = structuredClone(validInvoice());
		invoice.lines[0].lineTotalAmount = 555;
		const result = validate(invoice, crossCheckRules);
		expect(result.errors.some((e) => e.ruleId === "INPUT-CROSS-01")).toBe(true);
	});

	it("within tolerance passes", () => {
		const invoice = structuredClone(validInvoice());
		const totals = invoice.totals;
		if (!totals) throw new Error("totals missing");
		totals.lineTotalAmount = 1000.005;
		const result = validate(invoice, crossCheckRules);
		expect(result.errors.filter((e) => e.ruleId === "BR-CO-10")).toEqual([]);
	});
});
