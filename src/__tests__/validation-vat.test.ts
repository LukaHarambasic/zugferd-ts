import { describe, expect, it } from "vitest";
import type { ZugferdInvoice } from "../types";
import {
	validateBrAe,
	validateBrE,
	validateBrFxEn04,
	validateBrG,
	validateBrIc,
	validateBrS,
} from "../validation/rules/vat-categories";

function standardRateInvoice(): ZugferdInvoice {
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
			taxRegistrations: [{ id: "DE987654321", schemeId: "VA" }],
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
				netPrice: 1000,
				product: { name: "Bauleistung" },
			},
		],
		taxBreakdown: [
			{
				categoryCode: "S",
				ratePercent: 19,
				basisAmount: 1000,
				calculatedAmount: 190,
			},
		],
	};
}

function reverseChargeInvoice(): ZugferdInvoice {
	return {
		invoiceNumber: "2026-002",
		issueDate: "20260520",
		typeCode: "380",
		currency: "EUR",
		seller: {
			name: "Subunternehmer GmbH",
			address: { countryCode: "DE" },
			taxRegistrations: [{ id: "DE111111111", schemeId: "VA" }],
		},
		buyer: {
			name: "Generalunternehmer AG",
			address: { countryCode: "DE" },
			taxRegistrations: [{ id: "DE222222222", schemeId: "VA" }],
		},
		deliveryDate: "20260520",
		paymentMeans: {
			typeCode: "58",
			payeeAccount: { iban: "DE89370400440532013000" },
		},
		lines: [
			{
				lineId: "1",
				taxCategoryCode: "AE",
				taxRate: 0,
				lineTotalAmount: 5000,
				quantity: 1,
				unitCode: "H87",
				netPrice: 5000,
				product: { name: "Rohbauarbeiten §13b" },
			},
		],
		taxBreakdown: [
			{
				categoryCode: "AE",
				ratePercent: 0,
				basisAmount: 5000,
				calculatedAmount: 0,
				exemptionReasonCode: "VATEX-EU-AE",
			},
		],
	};
}

function kleinunternehmerInvoice(): ZugferdInvoice {
	return {
		invoiceNumber: "2026-003",
		issueDate: "20260510",
		typeCode: "380",
		currency: "EUR",
		seller: {
			name: "Kleinunternehmer Muster",
			address: { countryCode: "DE" },
			taxRegistrations: [{ id: "123/456/78901", schemeId: "FC" }],
		},
		buyer: {
			name: "Kunde GmbH",
			address: { countryCode: "DE" },
			taxRegistrations: [],
		},
		deliveryDate: "20260510",
		paymentMeans: {
			typeCode: "58",
			payeeAccount: { iban: "DE89370400440532013000" },
		},
		lines: [
			{
				lineId: "1",
				taxCategoryCode: "E",
				taxRate: 0,
				lineTotalAmount: 800,
				quantity: 1,
				unitCode: "H87",
				netPrice: 800,
				product: { name: "Dienstleistung" },
			},
		],
		taxBreakdown: [
			{
				categoryCode: "E",
				ratePercent: 0,
				basisAmount: 800,
				calculatedAmount: 0,
				exemptionReason:
					"Kein Ausweis von Umsatzsteuer, da Kleinunternehmer gemäß § 19 UStG",
			},
		],
	};
}

function intraCommunityInvoice(): ZugferdInvoice {
	return {
		invoiceNumber: "2026-004",
		issueDate: "20260525",
		typeCode: "380",
		currency: "EUR",
		seller: {
			name: "German Exporter GmbH",
			address: { countryCode: "DE" },
			taxRegistrations: [{ id: "DE333333333", schemeId: "VA" }],
		},
		buyer: {
			name: "Austrian Buyer GmbH",
			address: { countryCode: "AT" },
			taxRegistrations: [{ id: "ATU44444444", schemeId: "VA" }],
		},
		deliveryDate: "20260525",
		shipTo: {
			name: "Austrian Delivery",
			address: { countryCode: "AT" },
		},
		paymentMeans: {
			typeCode: "58",
			payeeAccount: { iban: "DE89370400440532013000" },
		},
		lines: [
			{
				lineId: "1",
				taxCategoryCode: "K",
				taxRate: 0,
				lineTotalAmount: 3000,
				quantity: 1,
				unitCode: "H87",
				netPrice: 3000,
				product: { name: "Exportware" },
			},
		],
		taxBreakdown: [
			{
				categoryCode: "K",
				ratePercent: 0,
				basisAmount: 3000,
				calculatedAmount: 0,
				exemptionReasonCode: "VATEX-EU-IC",
			},
		],
	};
}

function exportInvoice(): ZugferdInvoice {
	return {
		invoiceNumber: "2026-005",
		issueDate: "20260601",
		typeCode: "380",
		currency: "EUR",
		seller: {
			name: "German Exporter GmbH",
			address: { countryCode: "DE" },
			taxRegistrations: [{ id: "DE555555555", schemeId: "VA" }],
		},
		buyer: {
			name: "US Buyer Inc",
			address: { countryCode: "US" },
			taxRegistrations: [],
		},
		deliveryDate: "20260601",
		paymentMeans: {
			typeCode: "58",
			payeeAccount: { iban: "DE89370400440532013000" },
		},
		lines: [
			{
				lineId: "1",
				taxCategoryCode: "G",
				taxRate: 0,
				lineTotalAmount: 2500,
				quantity: 1,
				unitCode: "H87",
				netPrice: 2500,
				product: { name: "Export goods" },
			},
		],
		taxBreakdown: [
			{
				categoryCode: "G",
				ratePercent: 0,
				basisAmount: 2500,
				calculatedAmount: 0,
				exemptionReasonCode: "VATEX-EU-G",
			},
		],
	};
}

describe("VAT category validation rules", () => {
	describe("BR-S Standard Rate", () => {
		it("Test 1 — standard rate valid", () => {
			const result = validateBrS(standardRateInvoice());
			expect(result).toEqual([]);
		});

		it("Test 2 — standard rate missing seller VAT-ID", () => {
			const invoice = structuredClone(standardRateInvoice());
			invoice.seller.taxRegistrations = [];
			const result = validateBrS(invoice);
			expect(result).toHaveLength(1);
			expect(result[0].ruleId).toBe("BR-S-02");
			expect(result[0].path).toBe("seller.taxRegistrations");
		});

		it("Test 3 — standard rate with taxRate = 0 in breakdown", () => {
			const invoice = structuredClone(standardRateInvoice());
			invoice.taxBreakdown = [
				{
					categoryCode: "S",
					ratePercent: 0,
					basisAmount: 1000,
					calculatedAmount: 0,
				},
			];
			const result = validateBrS(invoice);
			expect(result.some((e) => e.ruleId === "BR-S-05")).toBe(true);
		});
	});

	describe("BR-AE Reverse Charge", () => {
		it("Test 4 — reverse charge valid", () => {
			const result = validateBrAe(reverseChargeInvoice());
			expect(result).toEqual([]);
		});

		it("Test 5 — reverse charge missing buyer VAT-ID", () => {
			const invoice = structuredClone(reverseChargeInvoice());
			invoice.buyer.taxRegistrations = [];
			const result = validateBrAe(invoice);
			expect(result).toHaveLength(1);
			expect(result[0].ruleId).toBe("BR-AE-03");
			expect(result[0].path).toBe("buyer.taxRegistrations");
		});

		it("Test 6 — reverse charge with non-zero calculated amount", () => {
			const invoice = structuredClone(reverseChargeInvoice());
			invoice.taxBreakdown = [
				{
					categoryCode: "AE",
					ratePercent: 0,
					basisAmount: 5000,
					calculatedAmount: 950,
					exemptionReasonCode: "VATEX-EU-AE",
				},
			];
			const result = validateBrAe(invoice);
			expect(result.some((e) => e.ruleId === "BR-AE-05")).toBe(true);
		});

		it("Test 7 — reverse charge missing exemption reason", () => {
			const invoice = structuredClone(reverseChargeInvoice());
			invoice.taxBreakdown = [
				{
					categoryCode: "AE",
					ratePercent: 0,
					basisAmount: 5000,
					calculatedAmount: 0,
				},
			];
			const result = validateBrAe(invoice);
			expect(result).toHaveLength(1);
			expect(result[0].ruleId).toBe("BR-AE-07");
		});
	});

	describe("BR-E Kleinunternehmer", () => {
		it("Test 8 — Kleinunternehmer valid", () => {
			const result = validateBrE(kleinunternehmerInvoice());
			expect(result).toEqual([]);
		});

		it("Test 9 — Kleinunternehmer missing exemption reason", () => {
			const invoice = structuredClone(kleinunternehmerInvoice());
			invoice.taxBreakdown = [
				{
					categoryCode: "E",
					ratePercent: 0,
					basisAmount: 800,
					calculatedAmount: 0,
				},
			];
			const result = validateBrE(invoice);
			expect(result).toHaveLength(1);
			expect(result[0].ruleId).toBe("BR-E-05");
		});
	});

	describe("BR-FX-EN-04 German Domestic", () => {
		it("Test 10 — German domestic missing delivery date AND billing period", () => {
			const invoice = structuredClone(standardRateInvoice());
			invoice.deliveryDate = undefined;
			invoice.billingPeriod = undefined;
			invoice.lines[0].billingPeriod = undefined;
			const result = validateBrFxEn04(invoice);
			expect(result).toHaveLength(1);
			expect(result[0].ruleId).toBe("BR-FX-EN-04");
		});

		it("Test 11 — German domestic with deliveryDate present", () => {
			const result = validateBrFxEn04(standardRateInvoice());
			expect(result).toEqual([]);
		});

		it("Test 12 — German domestic with header billingPeriod present", () => {
			const invoice = structuredClone(standardRateInvoice());
			invoice.deliveryDate = undefined;
			invoice.billingPeriod = { startDate: "20260501", endDate: "20260531" };
			const result = validateBrFxEn04(invoice);
			expect(result).toEqual([]);
		});

		it("Test 13 — Non-domestic (seller DE, buyer FR)", () => {
			const invoice = structuredClone(standardRateInvoice());
			invoice.buyer.address.countryCode = "FR";
			const result = validateBrFxEn04(invoice);
			expect(result).toEqual([]);
		});
	});

	describe("BR-IC Intra-Community", () => {
		it("Test 14 — Intra-community missing ship-to country", () => {
			const invoice = structuredClone(intraCommunityInvoice());
			invoice.shipTo = undefined;
			const result = validateBrIc(invoice);
			expect(result.some((e) => e.ruleId === "BR-IC-12")).toBe(true);
			expect(result.find((e) => e.ruleId === "BR-IC-12")?.path).toBe(
				"invoice.shipToAddress.countryCode",
			);
		});
	});

	describe("BR-G Export", () => {
		it("export invoice is valid", () => {
			const result = validateBrG(exportInvoice());
			expect(result).toEqual([]);
		});
	});
});
