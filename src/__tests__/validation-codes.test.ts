import { describe, expect, it } from "vitest";
import type { ZugferdInvoice } from "../types";
import { codeRules } from "../validation/rules/codes";
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
			taxRegistrations: [{ id: "DE987654321", schemeId: "VA" }],
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

describe("code-list validation rules", () => {
	it("valid invoice passes all rules", () => {
		const result = validate(validInvoice(), codeRules);
		expect(result.valid).toBe(true);
		expect(result.errors).toHaveLength(0);
	});

	it("INPUT-CODE-01: invalid payment means type code produces error", () => {
		const invoice = structuredClone(validInvoice());
		invoice.paymentMeans.typeCode = "99";
		const result = validate(invoice, codeRules);
		expect(result.errors.some((e) => e.ruleId === "INPUT-CODE-01")).toBe(true);
	});

	it("INPUT-CODE-01: valid payment means type code 30 passes", () => {
		const invoice = structuredClone(validInvoice());
		invoice.paymentMeans.typeCode = "30";
		const result = validate(invoice, codeRules);
		expect(result.errors.some((e) => e.ruleId === "INPUT-CODE-01")).toBe(false);
	});

	it("INPUT-CODE-02: invalid unit code produces error with correct path", () => {
		const invoice = structuredClone(validInvoice());
		invoice.lines[0].unitCode = "INVALID";
		const result = validate(invoice, codeRules);
		const errors = result.errors.filter((e) => e.ruleId === "INPUT-CODE-02");
		expect(errors.length).toBeGreaterThan(0);
		expect(errors[0].path).toContain("lines[0]");
	});

	it("INPUT-CODE-02: valid unit code KGM passes", () => {
		const invoice = structuredClone(validInvoice());
		invoice.lines[0].unitCode = "KGM";
		const result = validate(invoice, codeRules);
		expect(result.errors.some((e) => e.ruleId === "INPUT-CODE-02")).toBe(false);
	});

	it("INPUT-CODE-02: empty unit code is skipped (BR-23 handles that)", () => {
		const invoice = structuredClone(validInvoice());
		invoice.lines[0].unitCode = "";
		const result = validate(invoice, codeRules);
		expect(result.errors.some((e) => e.ruleId === "INPUT-CODE-02")).toBe(false);
	});

	it("INPUT-CODE-03: invalid line tax category code produces error", () => {
		const invoice = structuredClone(validInvoice());
		invoice.lines[0].taxCategoryCode = "X";
		const result = validate(invoice, codeRules);
		expect(result.errors.some((e) => e.ruleId === "INPUT-CODE-03")).toBe(true);
	});

	it("INPUT-CODE-03: valid tax category code AE passes", () => {
		const invoice = structuredClone(validInvoice());
		invoice.lines[0].taxCategoryCode = "AE";
		const result = validate(invoice, codeRules);
		expect(result.errors.some((e) => e.ruleId === "INPUT-CODE-03")).toBe(false);
	});

	it("INPUT-CODE-04: invalid allowance tax category code produces error", () => {
		const invoice = structuredClone(validInvoice());
		invoice.allowances = [
			{ actualAmount: 50, taxCategoryCode: "X", reason: "discount" },
		];
		const result = validate(invoice, codeRules);
		expect(result.errors.some((e) => e.ruleId === "INPUT-CODE-04")).toBe(true);
	});

	it("INPUT-CODE-05: invalid charge tax category code produces error", () => {
		const invoice = structuredClone(validInvoice());
		invoice.charges = [
			{ actualAmount: 20, taxCategoryCode: "Y", reason: "freight" },
		];
		const result = validate(invoice, codeRules);
		expect(result.errors.some((e) => e.ruleId === "INPUT-CODE-05")).toBe(true);
	});

	it("INPUT-CODE-06: invalid tax breakdown category code produces error", () => {
		const invoice = structuredClone(validInvoice());
		invoice.taxBreakdown = [
			{
				basisAmount: 1000,
				calculatedAmount: 190,
				categoryCode: "X",
				ratePercent: 19,
			},
		];
		const result = validate(invoice, codeRules);
		expect(result.errors.some((e) => e.ruleId === "INPUT-CODE-06")).toBe(true);
	});

	it("INPUT-CODE-07: invalid allowance reason code produces error", () => {
		const invoice = structuredClone(validInvoice());
		invoice.allowances = [
			{ actualAmount: 50, taxCategoryCode: "S", reasonCode: "INVALID" },
		];
		const result = validate(invoice, codeRules);
		expect(result.errors.some((e) => e.ruleId === "INPUT-CODE-07")).toBe(true);
	});

	it("INPUT-CODE-07: valid allowance reason code 95 passes", () => {
		const invoice = structuredClone(validInvoice());
		invoice.allowances = [
			{ actualAmount: 50, taxCategoryCode: "S", reasonCode: "95" },
		];
		const result = validate(invoice, codeRules);
		expect(result.errors.some((e) => e.ruleId === "INPUT-CODE-07")).toBe(false);
	});

	it("INPUT-CODE-07: missing allowance reason code is skipped", () => {
		const invoice = structuredClone(validInvoice());
		invoice.allowances = [
			{ actualAmount: 50, taxCategoryCode: "S", reason: "discount" },
		];
		const result = validate(invoice, codeRules);
		expect(result.errors.some((e) => e.ruleId === "INPUT-CODE-07")).toBe(false);
	});

	it("INPUT-CODE-08: invalid charge reason code produces error", () => {
		const invoice = structuredClone(validInvoice());
		invoice.charges = [
			{ actualAmount: 20, taxCategoryCode: "S", reasonCode: "ZZZ" },
		];
		const result = validate(invoice, codeRules);
		expect(result.errors.some((e) => e.ruleId === "INPUT-CODE-08")).toBe(true);
	});

	it("INPUT-CODE-09: invalid note subject code produces error", () => {
		const invoice = structuredClone(validInvoice());
		invoice.notes = [{ content: "some note", subjectCode: "XYZ" }];
		const result = validate(invoice, codeRules);
		expect(result.errors.some((e) => e.ruleId === "INPUT-CODE-09")).toBe(true);
	});

	it("INPUT-CODE-09: valid note subject code REG passes", () => {
		const invoice = structuredClone(validInvoice());
		invoice.notes = [{ content: "some note", subjectCode: "REG" }];
		const result = validate(invoice, codeRules);
		expect(result.errors.some((e) => e.ruleId === "INPUT-CODE-09")).toBe(false);
	});

	it("INPUT-CODE-10: invalid seller tax scheme ID produces error", () => {
		const invoice = structuredClone(validInvoice());
		invoice.seller.taxRegistrations = [{ id: "DE123456789", schemeId: "ZZ" }];
		const result = validate(invoice, codeRules);
		const errors = result.errors.filter((e) => e.ruleId === "INPUT-CODE-10");
		expect(errors.length).toBeGreaterThan(0);
		expect(errors[0].path).toContain("seller.taxRegistrations[0]");
	});

	it("INPUT-CODE-10: valid seller tax scheme ID FC passes", () => {
		const invoice = structuredClone(validInvoice());
		invoice.seller.taxRegistrations = [{ id: "FA123", schemeId: "FC" }];
		const result = validate(invoice, codeRules);
		expect(result.errors.some((e) => e.ruleId === "INPUT-CODE-10")).toBe(false);
	});

	it("INPUT-CODE-11: invalid buyer tax scheme ID produces error", () => {
		const invoice = structuredClone(validInvoice());
		invoice.buyer.taxRegistrations = [{ id: "DE987654321", schemeId: "XX" }];
		const result = validate(invoice, codeRules);
		expect(result.errors.some((e) => e.ruleId === "INPUT-CODE-11")).toBe(true);
	});

	it("INPUT-CODE-12: invalid seller electronic address scheme ID produces error", () => {
		const invoice = structuredClone(validInvoice());
		invoice.seller.electronicAddress = {
			id: "seller@example.com",
			schemeId: "ZZ",
		};
		const result = validate(invoice, codeRules);
		expect(result.errors.some((e) => e.ruleId === "INPUT-CODE-12")).toBe(true);
	});

	it("INPUT-CODE-12: valid seller electronic address scheme ID EM passes", () => {
		const invoice = structuredClone(validInvoice());
		invoice.seller.electronicAddress = {
			id: "seller@example.com",
			schemeId: "EM",
		};
		const result = validate(invoice, codeRules);
		expect(result.errors.some((e) => e.ruleId === "INPUT-CODE-12")).toBe(false);
	});

	it("INPUT-CODE-12: no seller electronic address is skipped", () => {
		const invoice = structuredClone(validInvoice());
		invoice.seller.electronicAddress = undefined;
		const result = validate(invoice, codeRules);
		expect(result.errors.some((e) => e.ruleId === "INPUT-CODE-12")).toBe(false);
	});

	it("INPUT-CODE-13: invalid buyer electronic address scheme ID produces error", () => {
		const invoice = structuredClone(validInvoice());
		invoice.buyer.electronicAddress = {
			id: "buyer@example.com",
			schemeId: "ZZ",
		};
		const result = validate(invoice, codeRules);
		expect(result.errors.some((e) => e.ruleId === "INPUT-CODE-13")).toBe(true);
	});

	it("INPUT-CODE-14: invalid seller global ID scheme ID produces error", () => {
		const invoice = structuredClone(validInvoice());
		invoice.seller.globalIds = [{ id: "1234567890123", schemeId: "9999" }];
		const result = validate(invoice, codeRules);
		expect(result.errors.some((e) => e.ruleId === "INPUT-CODE-14")).toBe(true);
	});

	it("INPUT-CODE-14: valid seller global ID scheme ID 0088 passes", () => {
		const invoice = structuredClone(validInvoice());
		invoice.seller.globalIds = [{ id: "1234567890123", schemeId: "0088" }];
		const result = validate(invoice, codeRules);
		expect(result.errors.some((e) => e.ruleId === "INPUT-CODE-14")).toBe(false);
	});

	it("INPUT-CODE-14: seller global ID without schemeId is skipped", () => {
		const invoice = structuredClone(validInvoice());
		invoice.seller.globalIds = [{ id: "1234567890123" }];
		const result = validate(invoice, codeRules);
		expect(result.errors.some((e) => e.ruleId === "INPUT-CODE-14")).toBe(false);
	});

	it("INPUT-CODE-15: invalid buyer global ID scheme ID produces error", () => {
		const invoice = structuredClone(validInvoice());
		invoice.buyer.globalIds = [{ id: "9876543210987", schemeId: "1111" }];
		const result = validate(invoice, codeRules);
		expect(result.errors.some((e) => e.ruleId === "INPUT-CODE-15")).toBe(true);
	});

	it("INPUT-CODE-16: invalid line allowance reason code produces error with correct path", () => {
		const invoice = structuredClone(validInvoice());
		invoice.lines[0].allowances = [{ actualAmount: 10, reasonCode: "WRONG" }];
		const result = validate(invoice, codeRules);
		const errors = result.errors.filter((e) => e.ruleId === "INPUT-CODE-16");
		expect(errors.length).toBeGreaterThan(0);
		expect(errors[0].path).toContain("lines[0].allowances[0]");
	});

	it("INPUT-CODE-16: valid line allowance reason code 100 passes", () => {
		const invoice = structuredClone(validInvoice());
		invoice.lines[0].allowances = [{ actualAmount: 10, reasonCode: "100" }];
		const result = validate(invoice, codeRules);
		expect(result.errors.some((e) => e.ruleId === "INPUT-CODE-16")).toBe(false);
	});

	it("INPUT-CODE-16: missing line allowance reason code is skipped", () => {
		const invoice = structuredClone(validInvoice());
		invoice.lines[0].allowances = [{ actualAmount: 10, reason: "discount" }];
		const result = validate(invoice, codeRules);
		expect(result.errors.some((e) => e.ruleId === "INPUT-CODE-16")).toBe(false);
	});

	it("INPUT-CODE-17: invalid line charge reason code produces error", () => {
		const invoice = structuredClone(validInvoice());
		invoice.lines[0].charges = [{ actualAmount: 5, reasonCode: "NOPE" }];
		const result = validate(invoice, codeRules);
		expect(result.errors.some((e) => e.ruleId === "INPUT-CODE-17")).toBe(true);
	});

	it("INPUT-CODE-17: valid line charge reason code FC passes", () => {
		const invoice = structuredClone(validInvoice());
		invoice.lines[0].charges = [{ actualAmount: 5, reasonCode: "FC" }];
		const result = validate(invoice, codeRules);
		expect(result.errors.some((e) => e.ruleId === "INPUT-CODE-17")).toBe(false);
	});
});
