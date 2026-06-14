import { PDFName } from "pdf-lib";
import { describe, expect, it } from "vitest";
import type { ZugferdInvoice } from "../index";
import { generateXml, generateZugferd, validateInvoice } from "../index";

function abschlagsrechnungFixture(): ZugferdInvoice {
	return {
		invoiceNumber: "210111",
		typeCode: "875",
		issueDate: "20250530",
		currency: "EUR",
		seller: {
			name: "Musterbetrieb AG Demodaten",
			address: {
				lineOne: "Musterstraße 1",
				city: "Musterstadt",
				postalCode: "12345",
				countryCode: "DE",
			},
			taxRegistrations: [{ id: "DE09687654321", schemeId: "VA" }],
		},
		buyer: {
			name: "Auftraggeber Firmenkunde GmbH",
			address: {
				lineOne: "Kundenallee 1",
				city: "Musterstadt",
				postalCode: "12345",
				countryCode: "DE",
			},
		},
		lines: [
			{
				lineId: "1",
				product: { name: "Bauarbeiten Pos. 1" },
				quantity: 7.0,
				unitCode: "H87",
				netPrice: 300,
				taxCategoryCode: "S",
				taxRate: 19,
				lineTotalAmount: 2100.0,
			},
			{
				lineId: "2",
				product: { name: "Bauarbeiten Pos. 2" },
				quantity: 6.0,
				unitCode: "MTK",
				netPrice: 250,
				taxCategoryCode: "S",
				taxRate: 19,
				lineTotalAmount: 1500.0,
			},
		],
		paymentMeans: {
			typeCode: "58",
			payeeAccount: { iban: "DE02120300000000202051", bic: "BYLADEM1001" },
		},
		billingPeriod: { startDate: "20250513", endDate: "20250530" },
		paymentTerms: [
			{
				description:
					"2,5% Skonto innerhalb 14 Tagen, Zahlungsziel 30 Tage netto",
			},
		],
		taxBreakdown: [
			{
				categoryCode: "S",
				ratePercent: 19,
				basisAmount: 3600.0,
				calculatedAmount: 684.0,
			},
		],
		totals: {
			lineTotalAmount: 3600.0,
			taxBasisTotalAmount: 3600.0,
			taxTotalAmount: 684.0,
			grandTotalAmount: 4284.0,
			duePayableAmount: 4284.0,
		},
	};
}

function schlussrechnungFixture(): ZugferdInvoice {
	return {
		invoiceNumber: "210222",
		typeCode: "877",
		issueDate: "20250630",
		currency: "EUR",
		seller: {
			name: "Musterbetrieb AG Demodaten",
			address: {
				lineOne: "Musterstraße 1",
				city: "Musterstadt",
				postalCode: "12345",
				countryCode: "DE",
			},
			taxRegistrations: [{ id: "DE09687654321", schemeId: "VA" }],
		},
		buyer: {
			name: "Auftraggeber Firmenkunde GmbH",
			address: {
				lineOne: "Kundenallee 1",
				city: "Musterstadt",
				postalCode: "12345",
				countryCode: "DE",
			},
		},
		lines: [
			{
				lineId: "1",
				product: { name: "Bauarbeiten Pos. 1" },
				quantity: 1,
				unitCode: "C62",
				netPrice: 2000,
				taxCategoryCode: "S",
				taxRate: 19,
				lineTotalAmount: 2000.0,
			},
			{
				lineId: "2",
				product: { name: "Bauarbeiten Pos. 2" },
				quantity: 1,
				unitCode: "C62",
				netPrice: 2000,
				taxCategoryCode: "S",
				taxRate: 19,
				lineTotalAmount: 2000.0,
			},
			{
				lineId: "3",
				product: { name: "Bauarbeiten Pos. 3" },
				quantity: 1,
				unitCode: "C62",
				netPrice: 2000,
				taxCategoryCode: "S",
				taxRate: 19,
				lineTotalAmount: 2000.0,
			},
			{
				lineId: "4",
				product: { name: "Bauarbeiten Pos. 4" },
				quantity: 1,
				unitCode: "C62",
				netPrice: 2000,
				taxCategoryCode: "S",
				taxRate: 19,
				lineTotalAmount: 2000.0,
			},
			{
				lineId: "5",
				product: { name: "Bauarbeiten Pos. 5" },
				quantity: 1,
				unitCode: "C62",
				netPrice: 2000,
				taxCategoryCode: "S",
				taxRate: 19,
				lineTotalAmount: 2000.0,
			},
			{
				lineId: "6",
				product: { name: "Bauarbeiten Pos. 6" },
				quantity: 1,
				unitCode: "C62",
				netPrice: 2050,
				taxCategoryCode: "S",
				taxRate: 19,
				lineTotalAmount: 2050.0,
			},
			{
				lineId: "7",
				product: { name: "Bauarbeiten Pos. 7" },
				quantity: 1,
				unitCode: "C62",
				netPrice: 2050,
				taxCategoryCode: "S",
				taxRate: 19,
				lineTotalAmount: 2050.0,
			},
		],
		paymentMeans: {
			typeCode: "58",
			payeeAccount: { iban: "DE02120300000000202051", bic: "BYLADEM1001" },
		},
		paymentTerms: [
			{ description: "Zahlbar innerhalb 30 Tagen", dueDate: "20250730" },
		],
		billingPeriod: { startDate: "20250601", endDate: "20250630" },
		advancePayments: [{ paidAmount: 4284.0 }, { paidAmount: 5716.0 }],
		taxBreakdown: [
			{
				categoryCode: "S",
				ratePercent: 19,
				basisAmount: 14100.0,
				calculatedAmount: 2679.0,
			},
		],
		totals: {
			lineTotalAmount: 14100.0,
			taxBasisTotalAmount: 14100.0,
			taxTotalAmount: 2679.0,
			grandTotalAmount: 16779.0,
			totalPrepaidAmount: 10000.0,
			duePayableAmount: 6779.0,
		},
	};
}

describe("ZUGFeRD integration", () => {
	it("generates valid XML for minimal Abschlagsrechnung", () => {
		const xml = generateXml(abschlagsrechnungFixture());
		expect(xml).toMatch(/^<\?xml/);
		expect(xml).toContain("rsm:CrossIndustryInvoice");
		expect(xml).toContain(
			"urn:cen.eu:en16931:2017#conformant#urn:factur-x.eu:1p0:extended",
		);
	});

	it("produces correct monetary XML for Abschlagsrechnung", () => {
		const xml = generateXml(abschlagsrechnungFixture());
		expect(xml).toContain("<ram:LineTotalAmount>3600.00</ram:LineTotalAmount>");
		expect(xml).toContain(
			"<ram:TaxBasisTotalAmount>3600.00</ram:TaxBasisTotalAmount>",
		);
		expect(xml).toContain("<ram:TaxTotalAmount");
		expect(xml).toContain("684.00");
		expect(xml).toContain(
			"<ram:GrandTotalAmount>4284.00</ram:GrandTotalAmount>",
		);
		expect(xml).toContain(
			"<ram:DuePayableAmount>4284.00</ram:DuePayableAmount>",
		);
	});

	it("produces correct advance payment XML for Schlussrechnung", () => {
		const xml = generateXml(schlussrechnungFixture());
		expect(xml).toContain("4284.00");
		expect(xml).toContain("5716.00");
		expect(xml).toContain(
			"<ram:TotalPrepaidAmount>10000.00</ram:TotalPrepaidAmount>",
		);
		expect(xml).toContain(
			"<ram:DuePayableAmount>6779.00</ram:DuePayableAmount>",
		);
	});

	it("returns structured errors for invalid invoice", async () => {
		const invalid: Partial<ZugferdInvoice> = {
			invoiceNumber: "",
			typeCode: "380",
			issueDate: "20250101",
			currency: "EUR",
			seller: { name: "", address: { countryCode: "DE" } },
			buyer: { name: "Buyer", address: { countryCode: "DE" } },
			lines: [],
			paymentMeans: { typeCode: "31" },
			taxBreakdown: [],
			totals: {
				lineTotalAmount: 0,
				taxBasisTotalAmount: 0,
				taxTotalAmount: 0,
				grandTotalAmount: 0,
				duePayableAmount: 0,
			},
		};

		const result = await generateZugferd(
			invalid as ZugferdInvoice,
			new Uint8Array(),
		);
		expect(result.xml).toBe("");
		expect(result.pdfBuffer).toEqual(new Uint8Array());
		expect(result.validationErrors.length).toBeGreaterThan(0);

		const ruleIds = result.validationErrors.map((e) => e.ruleId);
		expect(ruleIds).toContain("BR-01");
		expect(ruleIds).toContain("BR-06");
		expect(ruleIds).toContain("BR-16");
	});

	it("generates valid XML for reverse charge invoice", () => {
		const invoice: ZugferdInvoice = {
			...abschlagsrechnungFixture(),
			typeCode: "380",
			lines: [
				{
					lineId: "1",
					product: { name: "Subunternehmerleistung" },
					quantity: 1,
					unitCode: "C62",
					netPrice: 5000,
					taxCategoryCode: "AE",
					taxRate: 0,
					lineTotalAmount: 5000,
				},
			],
			taxBreakdown: [
				{
					categoryCode: "AE",
					ratePercent: 0,
					basisAmount: 5000,
					calculatedAmount: 0,
					exemptionReason: "Steuerschuldnerschaft des Leistungsempfängers",
				},
			],
			totals: {
				lineTotalAmount: 5000,
				taxBasisTotalAmount: 5000,
				taxTotalAmount: 0,
				grandTotalAmount: 5000,
				duePayableAmount: 5000,
			},
			seller: {
				...abschlagsrechnungFixture().seller,
				taxRegistrations: [{ id: "DE09687654321", schemeId: "VA" }],
			},
			buyer: {
				...abschlagsrechnungFixture().buyer,
				taxRegistrations: [{ id: "DE12345678901", schemeId: "VA" }],
			},
		};

		const result = validateInvoice(invoice);
		expect(result.valid).toBe(true);
		expect(result.errors).toHaveLength(0);

		const xml = generateXml(invoice);
		expect(xml).toContain("AE");
		expect(xml).toContain("Steuerschuldnerschaft des Leistungsempfängers");
	});

	it("generates valid XML for Kleinunternehmer invoice", () => {
		const invoice: ZugferdInvoice = {
			...abschlagsrechnungFixture(),
			typeCode: "380",
			seller: {
				name: "Kleinbetrieb Müller",
				address: {
					lineOne: "Dorfweg 1",
					city: "Kleinstadt",
					postalCode: "99999",
					countryCode: "DE",
				},
				taxRegistrations: [{ id: "123/456/78901", schemeId: "FC" }],
			},
			lines: [
				{
					lineId: "1",
					product: { name: "Handwerkerleistung" },
					quantity: 10,
					unitCode: "HUR",
					netPrice: 50,
					taxCategoryCode: "E",
					taxRate: 0,
					lineTotalAmount: 500,
				},
			],
			taxBreakdown: [
				{
					categoryCode: "E",
					ratePercent: 0,
					basisAmount: 500,
					calculatedAmount: 0,
					exemptionReason:
						"Kein Ausweis von Umsatzsteuer, da Kleinunternehmer gemäß § 19 UStG",
				},
			],
			totals: {
				lineTotalAmount: 500,
				taxBasisTotalAmount: 500,
				taxTotalAmount: 0,
				grandTotalAmount: 500,
				duePayableAmount: 500,
			},
		};

		const result = validateInvoice(invoice);
		expect(result.valid).toBe(true);
		expect(result.errors).toHaveLength(0);

		const xml = generateXml(invoice);
		expect(xml).toContain("Kein Ausweis von Umsatzsteuer");
	});

	it("validateInvoice returns valid for correct invoice", () => {
		const result = validateInvoice(abschlagsrechnungFixture());
		expect(result.valid).toBe(true);
		expect(result.errors).toHaveLength(0);
		expect(result.warnings).toHaveLength(0);
	});

	it("validateInvoice returns errors for invalid invoice", () => {
		const invoice = structuredClone(abschlagsrechnungFixture());
		invoice.invoiceNumber = "";
		invoice.lines = [];

		const result = validateInvoice(invoice);
		expect(result.valid).toBe(false);
		expect(result.errors.map((e) => e.ruleId)).toContain("BR-01");
		expect(result.errors.map((e) => e.ruleId)).toContain("BR-16");
	});

	it("generateXml returns valid XML string", () => {
		const xml = generateXml(abschlagsrechnungFixture());
		expect(xml).toMatch(/^<\?xml/);
		expect(xml).toContain("rsm:CrossIndustryInvoice");
		expect(xml).toContain(
			"urn:cen.eu:en16931:2017#conformant#urn:factur-x.eu:1p0:extended",
		);
	});

	it("generateZugferd embeds XML into PDF for valid invoice", async () => {
		const { PDFDocument } = await import("pdf-lib");
		const doc = await PDFDocument.create();
		doc.addPage([595, 842]);
		const pdfBytes = await doc.save();

		const result = await generateZugferd(abschlagsrechnungFixture(), pdfBytes);
		expect(result.validationErrors).toHaveLength(0);
		expect(result.xml).toContain("rsm:CrossIndustryInvoice");
		expect(result.pdfBuffer.length).toBeGreaterThan(pdfBytes.length);

		const loadedPdf = await PDFDocument.load(result.pdfBuffer);
		const catalog = loadedPdf.catalog;
		const af = catalog.lookup(PDFName.of("AF"));
		expect(af).toBeDefined();
	}, 10000);
});
