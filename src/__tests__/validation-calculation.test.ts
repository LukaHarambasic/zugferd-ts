import { describe, expect, it } from "vitest";
import type { ZugferdInvoice } from "../types";
import { calculationRules } from "../validation/rules/calculation";
import { validate } from "../validation/runner";

function validInvoice(): ZugferdInvoice {
	return {
		invoiceNumber: "2024-001",
		issueDate: "20240115",
		typeCode: "875",
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
		lines: [
			{
				lineId: "1",
				lineTotalAmount: 1000,
				taxCategoryCode: "S",
				taxRate: 19,
				quantity: 1,
				unitCode: "H87",
				netPrice: 1000,
				product: { name: "Bauleistung" },
			},
		],
		deliveryDate: "20240115",
		paymentMeans: {
			typeCode: "58",
			payeeAccount: { iban: "DE89370400440532013000", bic: "COBADEFFXXX" },
		},
		paymentTerms: [
			{ dueDate: "20240214", description: "Zahlbar innerhalb 30 Tagen" },
		],
		totals: {
			lineTotalAmount: 1000,
			taxBasisTotalAmount: 1000,
			taxTotalAmount: 190,
			grandTotalAmount: 1190,
			duePayableAmount: 1190,
		},
		taxBreakdown: [
			{
				basisAmount: 1000,
				calculatedAmount: 190,
				categoryCode: "S",
				ratePercent: 19,
			},
		],
	};
}

describe("calculation validation rules", () => {
	it("all stated values match computed — valid invoice passes", () => {
		const result = validate(validInvoice(), calculationRules);
		expect(result.valid).toBe(true);
	});

	it("BR-CO-16: duePayableAmount off by 0.02 produces error", () => {
		const invoice = structuredClone(validInvoice());
		const totals = invoice.totals;
		if (!totals) throw new Error("totals missing");
		totals.duePayableAmount = 1190.02;
		const result = validate(invoice, calculationRules);
		expect(result.errors.some((e) => e.ruleId === "BR-CO-16")).toBe(true);
	});

	it("BR-CO-14: taxTotalAmount mismatch produces error", () => {
		const invoice = structuredClone(validInvoice());
		const totals = invoice.totals;
		if (!totals) throw new Error("totals missing");
		totals.taxTotalAmount = 200;
		const result = validate(invoice, calculationRules);
		expect(result.errors.some((e) => e.ruleId === "BR-CO-14")).toBe(true);
	});

	it("BR-CO-18: empty taxBreakdown produces error", () => {
		const invoice = structuredClone(validInvoice());
		invoice.taxBreakdown = [];
		const result = validate(invoice, calculationRules);
		expect(result.errors.some((e) => e.ruleId === "BR-CO-18")).toBe(true);
	});

	it("BR-CO-26: seller without any identifier produces error", () => {
		const invoice = structuredClone(validInvoice());
		invoice.seller = {
			...invoice.seller,
			taxRegistrations: [],
			id: undefined,
			globalIds: undefined,
			legalOrganization: undefined,
		};
		const result = validate(invoice, calculationRules);
		expect(result.errors.some((e) => e.ruleId === "BR-CO-26")).toBe(true);
	});
});
