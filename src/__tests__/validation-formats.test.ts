import { describe, expect, it } from "vitest";
import type { ZugferdInvoice } from "../types";
import { formatRules } from "../validation/rules/formats";
import { validate } from "../validation/runner";

function validInvoice(): ZugferdInvoice {
	return {
		invoiceNumber: "2026-001",
		issueDate: "20260515",
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
		deliveryDate: "20260515",
		paymentMeans: {
			typeCode: "58",
			payeeAccount: { iban: "DE89370400440532013000" },
		},
		lines: [
			{
				lineId: "1",
				taxCategoryCode: "S",
				taxRate: 19,
				lineTotalAmount: 1000,
				quantity: 1,
				unitCode: "H87",
				netPrice: 100,
				product: { name: "Bauleistung" },
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

describe("Format validation rules", () => {
	it("valid baseline produces no errors", () => {
		const result = validate(validInvoice(), formatRules);
		expect(result.errors).toEqual([]);
		expect(result.valid).toBe(true);
	});

	describe("INPUT-FMT-01: deliveryDate format", () => {
		it("invalid deliveryDate (bad month 13) → error", () => {
			const invoice = structuredClone(validInvoice());
			invoice.deliveryDate = "20241332";
			const result = validate(invoice, formatRules);
			expect(result.errors).toHaveLength(1);
			expect(result.errors[0].ruleId).toBe("INPUT-FMT-01");
			expect(result.errors[0].path).toBe("invoice.deliveryDate");
		});

		it("absent deliveryDate → no error", () => {
			const invoice = structuredClone(validInvoice());
			invoice.deliveryDate = undefined;
			const result = validate(invoice, formatRules);
			expect(result.errors.filter((e) => e.ruleId === "INPUT-FMT-01")).toEqual(
				[],
			);
		});
	});

	describe("INPUT-FMT-02: billingPeriod.startDate format", () => {
		it("invalid startDate → error", () => {
			const invoice = structuredClone(validInvoice());
			invoice.billingPeriod = { startDate: "2024-01-01", endDate: "20240131" };
			const result = validate(invoice, formatRules);
			expect(result.errors.some((e) => e.ruleId === "INPUT-FMT-02")).toBe(true);
		});
	});

	describe("INPUT-FMT-03: billingPeriod.endDate format", () => {
		it("invalid endDate → error", () => {
			const invoice = structuredClone(validInvoice());
			invoice.billingPeriod = { startDate: "20240101", endDate: "notadate" };
			const result = validate(invoice, formatRules);
			expect(result.errors.some((e) => e.ruleId === "INPUT-FMT-03")).toBe(true);
		});
	});

	describe("INPUT-FMT-04: line billingPeriod.startDate format", () => {
		it("invalid line startDate → error", () => {
			const invoice = structuredClone(validInvoice());
			invoice.lines[0].billingPeriod = {
				startDate: "badstart",
				endDate: "20240131",
			};
			const result = validate(invoice, formatRules);
			expect(result.errors.some((e) => e.ruleId === "INPUT-FMT-04")).toBe(true);
		});
	});

	describe("INPUT-FMT-05: line billingPeriod.endDate format", () => {
		it("invalid line endDate → error", () => {
			const invoice = structuredClone(validInvoice());
			invoice.lines[0].billingPeriod = {
				startDate: "20240101",
				endDate: "badend",
			};
			const result = validate(invoice, formatRules);
			expect(result.errors.some((e) => e.ruleId === "INPUT-FMT-05")).toBe(true);
		});
	});

	describe("INPUT-FMT-06: paymentTerms dueDate format", () => {
		it("invalid dueDate → error", () => {
			const invoice = structuredClone(validInvoice());
			invoice.paymentTerms = [{ dueDate: "notadate" }];
			const result = validate(invoice, formatRules);
			expect(result.errors).toHaveLength(1);
			expect(result.errors[0].ruleId).toBe("INPUT-FMT-06");
			expect(result.errors[0].path).toBe("invoice.paymentTerms[0].dueDate");
		});

		it("valid dueDate → no error", () => {
			const invoice = structuredClone(validInvoice());
			invoice.paymentTerms = [{ dueDate: "20240215" }];
			const result = validate(invoice, formatRules);
			expect(result.errors.filter((e) => e.ruleId === "INPUT-FMT-06")).toEqual(
				[],
			);
		});

		it("absent dueDate → no error", () => {
			const invoice = structuredClone(validInvoice());
			invoice.paymentTerms = [{ description: "Net 30" }];
			const result = validate(invoice, formatRules);
			expect(result.errors.filter((e) => e.ruleId === "INPUT-FMT-06")).toEqual(
				[],
			);
		});
	});

	describe("INPUT-FMT-07: precedingInvoices issueDate format", () => {
		it("invalid issueDate → error", () => {
			const invoice = structuredClone(validInvoice());
			invoice.precedingInvoices = [
				{ reference: "2025-001", issueDate: "01-01-2025" },
			];
			const result = validate(invoice, formatRules);
			expect(result.errors.some((e) => e.ruleId === "INPUT-FMT-07")).toBe(true);
		});
	});

	describe("INPUT-FMT-08: advancePayments receivedDate format", () => {
		it("invalid receivedDate → error", () => {
			const invoice = structuredClone(validInvoice());
			invoice.advancePayments = [{ paidAmount: 500, receivedDate: "20249999" }];
			const result = validate(invoice, formatRules);
			expect(result.errors.some((e) => e.ruleId === "INPUT-FMT-08")).toBe(true);
		});
	});

	describe("INPUT-FMT-09: payee IBAN format", () => {
		it("invalid IBAN → error", () => {
			const invoice = structuredClone(validInvoice());
			invoice.paymentMeans.payeeAccount = { iban: "NOTANIBAN" };
			const result = validate(invoice, formatRules);
			expect(result.errors).toHaveLength(1);
			expect(result.errors[0].ruleId).toBe("INPUT-FMT-09");
			expect(result.errors[0].path).toBe(
				"invoice.paymentMeans.payeeAccount.iban",
			);
		});

		it("valid IBAN → no error", () => {
			const invoice = structuredClone(validInvoice());
			invoice.paymentMeans.payeeAccount = { iban: "DE89370400440532013000" };
			const result = validate(invoice, formatRules);
			expect(result.errors.filter((e) => e.ruleId === "INPUT-FMT-09")).toEqual(
				[],
			);
		});

		it("absent payeeAccount → no error", () => {
			const invoice = structuredClone(validInvoice());
			invoice.paymentMeans.payeeAccount = undefined;
			const result = validate(invoice, formatRules);
			expect(result.errors.filter((e) => e.ruleId === "INPUT-FMT-09")).toEqual(
				[],
			);
		});
	});

	describe("INPUT-FMT-10: payer IBAN format", () => {
		it("invalid payer IBAN → error", () => {
			const invoice = structuredClone(validInvoice());
			invoice.paymentMeans.payerAccount = { iban: "not-valid" };
			const result = validate(invoice, formatRules);
			expect(result.errors.some((e) => e.ruleId === "INPUT-FMT-10")).toBe(true);
		});

		it("valid payer IBAN → no error", () => {
			const invoice = structuredClone(validInvoice());
			invoice.paymentMeans.payerAccount = { iban: "DE89370400440532013000" };
			const result = validate(invoice, formatRules);
			expect(result.errors.filter((e) => e.ruleId === "INPUT-FMT-10")).toEqual(
				[],
			);
		});
	});

	describe("INPUT-FMT-11: line quantity must be finite", () => {
		it("NaN quantity → error", () => {
			const invoice = structuredClone(validInvoice());
			invoice.lines[0].quantity = Number.NaN;
			const result = validate(invoice, formatRules);
			expect(result.errors.some((e) => e.ruleId === "INPUT-FMT-11")).toBe(true);
			expect(result.errors.find((e) => e.ruleId === "INPUT-FMT-11")?.path).toBe(
				"invoice.lines[0].quantity",
			);
		});

		it("Infinity quantity → error", () => {
			const invoice = structuredClone(validInvoice());
			invoice.lines[0].quantity = Number.POSITIVE_INFINITY;
			const result = validate(invoice, formatRules);
			expect(result.errors.some((e) => e.ruleId === "INPUT-FMT-11")).toBe(true);
		});

		it("valid quantity → no error", () => {
			const invoice = structuredClone(validInvoice());
			invoice.lines[0].quantity = 5.5;
			const result = validate(invoice, formatRules);
			expect(result.errors.filter((e) => e.ruleId === "INPUT-FMT-11")).toEqual(
				[],
			);
		});
	});

	describe("INPUT-FMT-12: line netPrice must be finite and >= 0", () => {
		it("negative netPrice → error", () => {
			const invoice = structuredClone(validInvoice());
			invoice.lines[0].netPrice = -5;
			const result = validate(invoice, formatRules);
			expect(result.errors.some((e) => e.ruleId === "INPUT-FMT-12")).toBe(true);
			expect(result.errors.find((e) => e.ruleId === "INPUT-FMT-12")?.path).toBe(
				"invoice.lines[0].netPrice",
			);
		});

		it("NaN netPrice → error", () => {
			const invoice = structuredClone(validInvoice());
			invoice.lines[0].netPrice = Number.NaN;
			const result = validate(invoice, formatRules);
			expect(result.errors.some((e) => e.ruleId === "INPUT-FMT-12")).toBe(true);
		});

		it("zero netPrice → no error", () => {
			const invoice = structuredClone(validInvoice());
			invoice.lines[0].netPrice = 0;
			const result = validate(invoice, formatRules);
			expect(result.errors.filter((e) => e.ruleId === "INPUT-FMT-12")).toEqual(
				[],
			);
		});
	});

	describe("INPUT-FMT-13: totals monetary fields must be finite", () => {
		it("Infinity grandTotalAmount → error", () => {
			const invoice = structuredClone(validInvoice());
			if (invoice.totals)
				invoice.totals.grandTotalAmount = Number.POSITIVE_INFINITY;
			const result = validate(invoice, formatRules);
			expect(result.errors.some((e) => e.ruleId === "INPUT-FMT-13")).toBe(true);
			expect(result.errors.find((e) => e.ruleId === "INPUT-FMT-13")?.path).toBe(
				"invoice.totals.grandTotalAmount",
			);
		});

		it("NaN taxTotalAmount → error", () => {
			const invoice = structuredClone(validInvoice());
			if (invoice.totals) invoice.totals.taxTotalAmount = Number.NaN;
			const result = validate(invoice, formatRules);
			expect(result.errors.some((e) => e.ruleId === "INPUT-FMT-13")).toBe(true);
		});

		it("absent totals → no error from FMT-13", () => {
			const invoice = structuredClone(validInvoice());
			invoice.totals = undefined;
			const result = validate(invoice, formatRules);
			expect(result.errors.filter((e) => e.ruleId === "INPUT-FMT-13")).toEqual(
				[],
			);
		});

		it("all valid totals → no error", () => {
			const invoice = structuredClone(validInvoice());
			const result = validate(invoice, formatRules);
			expect(result.errors.filter((e) => e.ruleId === "INPUT-FMT-13")).toEqual(
				[],
			);
		});
	});
});
