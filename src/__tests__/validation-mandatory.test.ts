import { describe, expect, it } from "vitest";
import type { ZugferdInvoice } from "../types";
import { mandatoryRules } from "../validation/rules/mandatory";
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
	};
}

describe("mandatory validation rules", () => {
	it("BR-01: empty invoiceNumber produces error", () => {
		const invoice = structuredClone(validInvoice());
		invoice.invoiceNumber = "";
		const result = validate(invoice, mandatoryRules);
		expect(result.errors.some((e) => e.ruleId === "BR-01")).toBe(true);
	});

	it("BR-02: missing issueDate produces error", () => {
		const invoice = structuredClone(validInvoice());
		invoice.issueDate = undefined as unknown as string;
		const result = validate(invoice, mandatoryRules);
		expect(result.errors.some((e) => e.ruleId === "BR-02")).toBe(true);
	});

	it("BR-04: invalid typeCode produces error", () => {
		const invoice = structuredClone(validInvoice());
		invoice.typeCode = "999";
		const result = validate(invoice, mandatoryRules);
		expect(result.errors.some((e) => e.ruleId === "BR-04")).toBe(true);
	});

	it("BR-05: empty currency produces error", () => {
		const invoice = structuredClone(validInvoice());
		invoice.currency = "";
		const result = validate(invoice, mandatoryRules);
		expect(result.errors.some((e) => e.ruleId === "BR-05")).toBe(true);
	});

	it("BR-06: empty seller name produces error", () => {
		const invoice = structuredClone(validInvoice());
		invoice.seller.name = "";
		const result = validate(invoice, mandatoryRules);
		expect(result.errors.some((e) => e.ruleId === "BR-06")).toBe(true);
	});

	it("BR-07: empty buyer name produces error", () => {
		const invoice = structuredClone(validInvoice());
		invoice.buyer.name = "";
		const result = validate(invoice, mandatoryRules);
		expect(result.errors.some((e) => e.ruleId === "BR-07")).toBe(true);
	});

	it("BR-09: missing seller countryCode produces error", () => {
		const invoice = structuredClone(validInvoice());
		invoice.seller.address.countryCode = undefined as unknown as string;
		const result = validate(invoice, mandatoryRules);
		expect(result.errors.some((e) => e.ruleId === "BR-09")).toBe(true);
	});

	it("BR-11: missing buyer countryCode produces error", () => {
		const invoice = structuredClone(validInvoice());
		invoice.buyer.address.countryCode = undefined as unknown as string;
		const result = validate(invoice, mandatoryRules);
		expect(result.errors.some((e) => e.ruleId === "BR-11")).toBe(true);
	});

	it("BR-16: empty lines produces error", () => {
		const invoice = structuredClone(validInvoice());
		invoice.lines = [];
		const result = validate(invoice, mandatoryRules);
		expect(result.errors.some((e) => e.ruleId === "BR-16")).toBe(true);
	});

	it("BR-21: empty lineId on one line produces error with path containing lines[0]", () => {
		const invoice = structuredClone(validInvoice());
		invoice.lines[0].lineId = "";
		const result = validate(invoice, mandatoryRules);
		const br21Errors = result.errors.filter((e) => e.ruleId === "BR-21");
		expect(br21Errors.length).toBeGreaterThan(0);
		expect(br21Errors[0].path).toContain("lines[0]");
	});

	it("BR-25: empty product name produces error", () => {
		const invoice = structuredClone(validInvoice());
		invoice.lines[0].product.name = "";
		const result = validate(invoice, mandatoryRules);
		expect(result.errors.some((e) => e.ruleId === "BR-25")).toBe(true);
	});

	it("BR-33: doc allowance without reason or reasonCode produces error", () => {
		const invoice = structuredClone(validInvoice());
		invoice.allowances = [{ actualAmount: 50, taxCategoryCode: "S" }];
		const result = validate(invoice, mandatoryRules);
		expect(result.errors.some((e) => e.ruleId === "BR-33")).toBe(true);
	});

	it("BR-49: missing paymentMeans typeCode produces error", () => {
		const invoice = structuredClone(validInvoice());
		invoice.paymentMeans.typeCode = undefined as unknown as string;
		const result = validate(invoice, mandatoryRules);
		expect(result.errors.some((e) => e.ruleId === "BR-49")).toBe(true);
	});

	it("BR-50: SEPA without IBAN or proprietaryId produces error", () => {
		const invoice = structuredClone(validInvoice());
		invoice.paymentMeans.payeeAccount = { proprietaryId: undefined };
		const result = validate(invoice, mandatoryRules);
		expect(result.errors.some((e) => e.ruleId === "BR-50")).toBe(true);
	});

	it("valid invoice passes all rules", () => {
		const result = validate(validInvoice(), mandatoryRules);
		expect(result.valid).toBe(true);
		expect(result.errors).toHaveLength(0);
	});
});
