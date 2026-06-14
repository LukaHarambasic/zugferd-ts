import { PDFDocument, PDFName } from "pdf-lib";
import { describe, expect, it } from "vitest";
import type { ZugferdInvoice } from "../index";
import { generateXml, generateZugferd, validateInvoice } from "../index";

function bauAbschlagsrechnung(): ZugferdInvoice {
	return {
		invoiceNumber: "AR-2026-042",
		typeCode: "875",
		issueDate: "20260515",
		currency: "EUR",
		deliveryDate: "20260514",
		billingPeriod: { startDate: "20260401", endDate: "20260514" },
		buyerReference: "BV-Hauptstraße-7",
		contractReference: "BV-2026-003",
		projectReference: "PRJ-HS7",
		projectName: "Neubau Mehrfamilienhaus Hauptstraße 7",
		seller: {
			name: "Duvnjak Bau GmbH",
			id: "DB-001",
			legalOrganization: {
				id: "HRB 12345",
				schemeId: "HRB",
				tradingName: "Duvnjak Bau",
			},
			address: {
				lineOne: "Industriestraße 23",
				city: "Ludwigshafen am Rhein",
				postalCode: "67063",
				countryCode: "DE",
			},
			contact: {
				name: "Domagoj Duvnjak",
				phone: "+49 621 12345678",
				email: "rechnung@duvnjak-bau.de",
			},
			taxRegistrations: [
				{ id: "DE312345671", schemeId: "VA" },
				{ id: "086/234/56789", schemeId: "FC" },
			],
			electronicAddress: { id: "rechnung@duvnjak-bau.de", schemeId: "EM" },
		},
		buyer: {
			name: "Kraus Immobilien GmbH & Co. KG",
			legalOrganization: { id: "HRA 67890", schemeId: "HRA" },
			address: {
				lineOne: "Bismarckstraße 44",
				city: "Mannheim",
				postalCode: "68161",
				countryCode: "DE",
			},
			contact: {
				name: "Petra Kraus",
				phone: "+49 621 98765432",
				email: "p.kraus@kraus-immo.de",
			},
			taxRegistrations: [{ id: "DE398765438", schemeId: "VA" }],
		},
		shipTo: {
			name: "Baustelle Hauptstraße 7",
			address: {
				lineOne: "Hauptstraße 7",
				city: "Ludwigshafen am Rhein",
				postalCode: "67061",
				countryCode: "DE",
			},
		},
		lines: [
			{
				lineId: "01",
				product: {
					name: "Erdarbeiten und Baugrubenaushub",
					description:
						"Maschineller Aushub der Baugrube inkl. Abfuhr des Aushubs auf Deponie, Tiefe ca. 3,50 m",
					sellerAssignedId: "POS-001",
				},
				quantity: 450,
				unitCode: "MTQ",
				netPrice: 28.5,
				taxCategoryCode: "S",
				taxRate: 19,
				lineTotalAmount: 12825,
			},
			{
				lineId: "02",
				product: {
					name: "Bodenplatte bewehrt C25/30",
					description:
						"Stahlbetonbodenplatte C25/30, Dicke 25 cm, inkl. Bewehrung und Schalung",
					sellerAssignedId: "POS-002",
					attributes: [
						{ name: "Betongüte", value: "C25/30" },
						{ name: "Dicke", value: "25 cm" },
					],
				},
				quantity: 185.5,
				unitCode: "MTK",
				netPrice: 95,
				taxCategoryCode: "S",
				taxRate: 19,
				lineTotalAmount: 17622.5,
			},
			{
				lineId: "03",
				product: {
					name: "Mauerwerk KS-Planstein 11,5 DF",
					description:
						"Kalksandstein-Plansteinmauerwerk 11,5 cm, Mörtelgruppe IIa",
					sellerAssignedId: "POS-003",
				},
				quantity: 320,
				unitCode: "MTK",
				netPrice: 72,
				taxCategoryCode: "S",
				taxRate: 19,
				lineTotalAmount: 23040,
			},
			{
				lineId: "04",
				product: {
					name: "Deckenplatte Stahlbeton C30/37",
					description:
						"Ortbetondecke C30/37, Dicke 20 cm, inkl. Schalung und Bewehrung, EG",
					sellerAssignedId: "POS-004",
					attributes: [
						{ name: "Betongüte", value: "C30/37" },
						{ name: "Geschoss", value: "EG" },
					],
				},
				quantity: 195,
				unitCode: "MTK",
				netPrice: 115,
				taxCategoryCode: "S",
				taxRate: 19,
				lineTotalAmount: 22425,
			},
			{
				lineId: "05",
				product: {
					name: "Gerüststellung Fassadengerüst",
					description:
						"Standgerüst Fassade, Gerüstgruppe 3, Aufbau, Vorhaltung 12 Wochen, Abbau",
					sellerAssignedId: "POS-005",
				},
				quantity: 680,
				unitCode: "MTK",
				netPrice: 12.8,
				taxCategoryCode: "S",
				taxRate: 19,
				lineTotalAmount: 8704,
			},
			{
				lineId: "06",
				product: {
					name: "Stundenlohnarbeiten Polier",
					description: "Stundenlohnarbeiten nach Aufwand, Polier/Vorarbeiter",
					sellerAssignedId: "POS-006",
				},
				quantity: 24,
				unitCode: "HUR",
				netPrice: 62,
				taxCategoryCode: "S",
				taxRate: 19,
				lineTotalAmount: 1488,
			},
			{
				lineId: "07",
				product: {
					name: "Baustelleneinrichtung pauschal",
					description:
						"Baustelleneinrichtung, Bauzaun, Container, Sanitäranlagen, pauschal",
					sellerAssignedId: "POS-007",
				},
				quantity: 1,
				unitCode: "LS",
				netPrice: 4500,
				taxCategoryCode: "S",
				taxRate: 19,
				lineTotalAmount: 4500,
			},
		],
		paymentMeans: {
			typeCode: "58",
			information: "SEPA-Überweisung",
			payeeAccount: {
				iban: "DE89370400440532013000",
				bic: "COBADEFFXXX",
				accountName: "Duvnjak Bau GmbH",
			},
		},
		paymentTerms: [
			{
				description:
					"3% Skonto bei Zahlung innerhalb 14 Tagen nach Rechnungseingang",
				dueDate: "20260529",
				cashDiscount: { calculationPercent: 3, basisAmount: undefined },
			},
			{
				description:
					"Zahlbar ohne Abzug innerhalb 30 Tagen nach Rechnungseingang",
				dueDate: "20260614",
			},
		],
		notes: [
			{
				content: "1. Abschlagsrechnung gemäß Bauvertrag BV-2026-003",
				subjectCode: "ACB",
			},
			{
				content:
					"Gerichtsstand: Amtsgericht Ludwigshafen am Rhein, HRB 12345\nGeschäftsführer: Domagoj Duvnjak\nSteuer-Nr.: 086/234/56789",
				subjectCode: "REG",
			},
		],
		accountingReference: "4400",
		taxBreakdown: [
			{
				categoryCode: "S",
				ratePercent: 19,
				basisAmount: 90604.5,
				calculatedAmount: 17214.86,
			},
		],
		totals: {
			lineTotalAmount: 90604.5,
			taxBasisTotalAmount: 90604.5,
			taxTotalAmount: 17214.86,
			grandTotalAmount: 107819.36,
			duePayableAmount: 107819.36,
		},
	};
}

function schlussrechnungMitAbschlag(): ZugferdInvoice {
	return {
		invoiceNumber: "SR-2026-042",
		typeCode: "877",
		issueDate: "20260801",
		currency: "EUR",
		deliveryDate: "20260731",
		billingPeriod: { startDate: "20260401", endDate: "20260731" },
		contractReference: "BV-2026-003",
		projectReference: "PRJ-HS7",
		projectName: "Neubau Mehrfamilienhaus Hauptstraße 7",
		seller: {
			name: "Duvnjak Bau GmbH",
			address: {
				lineOne: "Industriestraße 23",
				city: "Ludwigshafen am Rhein",
				postalCode: "67063",
				countryCode: "DE",
			},
			contact: { name: "Domagoj Duvnjak", email: "rechnung@duvnjak-bau.de" },
			taxRegistrations: [
				{ id: "DE312345671", schemeId: "VA" },
				{ id: "086/234/56789", schemeId: "FC" },
			],
		},
		buyer: {
			name: "Kraus Immobilien GmbH & Co. KG",
			address: {
				lineOne: "Bismarckstraße 44",
				city: "Mannheim",
				postalCode: "68161",
				countryCode: "DE",
			},
			taxRegistrations: [{ id: "DE398765438", schemeId: "VA" }],
		},
		precedingInvoices: [
			{ reference: "AR-2026-042", issueDate: "20260515" },
			{ reference: "AR-2026-067", issueDate: "20260615" },
		],
		lines: [
			{
				lineId: "01",
				product: { name: "Erdarbeiten und Baugrubenaushub" },
				quantity: 480,
				unitCode: "MTQ",
				netPrice: 28.5,
				taxCategoryCode: "S",
				taxRate: 19,
				lineTotalAmount: 13680,
			},
			{
				lineId: "02",
				product: { name: "Bodenplatte bewehrt C25/30" },
				quantity: 185.5,
				unitCode: "MTK",
				netPrice: 95,
				taxCategoryCode: "S",
				taxRate: 19,
				lineTotalAmount: 17622.5,
			},
			{
				lineId: "03",
				product: { name: "Mauerwerk KS-Planstein komplett" },
				quantity: 890,
				unitCode: "MTK",
				netPrice: 72,
				taxCategoryCode: "S",
				taxRate: 19,
				lineTotalAmount: 64080,
			},
			{
				lineId: "04",
				product: { name: "Stahlbetondecken C30/37 alle Geschosse" },
				quantity: 580,
				unitCode: "MTK",
				netPrice: 115,
				taxCategoryCode: "S",
				taxRate: 19,
				lineTotalAmount: 66700,
			},
			{
				lineId: "05",
				product: { name: "Gerüststellung komplett" },
				quantity: 680,
				unitCode: "MTK",
				netPrice: 12.8,
				taxCategoryCode: "S",
				taxRate: 19,
				lineTotalAmount: 8704,
			},
			{
				lineId: "06",
				product: { name: "Stundenlohnarbeiten gesamt" },
				quantity: 156,
				unitCode: "HUR",
				netPrice: 62,
				taxCategoryCode: "S",
				taxRate: 19,
				lineTotalAmount: 9672,
			},
			{
				lineId: "07",
				product: { name: "Baustelleneinrichtung pauschal" },
				quantity: 1,
				unitCode: "LS",
				netPrice: 4500,
				taxCategoryCode: "S",
				taxRate: 19,
				lineTotalAmount: 4500,
			},
		],
		advancePayments: [
			{
				paidAmount: 65000,
				receivedDate: "20260601",
				includedTax: {
					calculatedAmount: 10378.15,
					typeCode: "VAT",
					categoryCode: "S",
					ratePercent: 19,
				},
				invoiceReference: {
					id: "AR-2026-042",
					typeCode: "875",
					issueDate: "20260515",
				},
			},
			{
				paidAmount: 45000,
				receivedDate: "20260701",
				includedTax: {
					calculatedAmount: 7184.87,
					typeCode: "VAT",
					categoryCode: "S",
					ratePercent: 19,
				},
				invoiceReference: {
					id: "AR-2026-067",
					typeCode: "875",
					issueDate: "20260615",
				},
			},
		],
		paymentMeans: {
			typeCode: "58",
			payeeAccount: {
				iban: "DE89370400440532013000",
				bic: "COBADEFFXXX",
				accountName: "Duvnjak Bau GmbH",
			},
		},
		paymentTerms: [
			{
				description: "Zahlbar innerhalb 14 Tagen nach Rechnungseingang",
				dueDate: "20260815",
			},
		],
		notes: [
			{
				content:
					"Schlussrechnung über sämtliche Bauleistungen gemäß Bauvertrag BV-2026-003. Bereits geleistete Abschlagszahlungen sind berücksichtigt.",
				subjectCode: "ACB",
			},
		],
		taxBreakdown: [
			{
				categoryCode: "S",
				ratePercent: 19,
				basisAmount: 184958.5,
				calculatedAmount: 35142.12,
			},
		],
		totals: {
			lineTotalAmount: 184958.5,
			taxBasisTotalAmount: 184958.5,
			taxTotalAmount: 35142.12,
			grandTotalAmount: 220100.62,
			totalPrepaidAmount: 110000,
			duePayableAmount: 110100.62,
		},
	};
}

function reverseChargeSubunternehmer(): ZugferdInvoice {
	return {
		invoiceNumber: "RE-2026-118",
		typeCode: "380",
		issueDate: "20260520",
		currency: "EUR",
		deliveryDate: "20260519",
		seller: {
			name: "Mahler Trockenbau e.K.",
			address: {
				lineOne: "Werkstraße 8",
				city: "Ludwigshafen am Rhein",
				postalCode: "67065",
				countryCode: "DE",
			},
			taxRegistrations: [{ id: "DE287654324", schemeId: "VA" }],
		},
		buyer: {
			name: "Duvnjak Bau GmbH",
			address: {
				lineOne: "Industriestraße 23",
				city: "Ludwigshafen am Rhein",
				postalCode: "67063",
				countryCode: "DE",
			},
			taxRegistrations: [{ id: "DE312345671", schemeId: "VA" }],
		},
		lines: [
			{
				lineId: "1",
				product: {
					name: "Trockenbauarbeiten EG, Ständerwerkwände 100 mm",
					description:
						"CW-Ständerwerk 100mm, beidseitig 12,5mm GKB, inkl. Mineralwolle 80mm",
				},
				quantity: 145,
				unitCode: "MTK",
				netPrice: 48.5,
				taxCategoryCode: "AE",
				taxRate: 0,
				exemptionReason:
					"Steuerschuldnerschaft des Leistungsempfängers gemäß §13b Abs. 2 Nr. 4 UStG",
				lineTotalAmount: 7032.5,
			},
			{
				lineId: "2",
				product: {
					name: "Abhangdecke OG, Gipskarton GKB 12,5",
					description:
						"Abhangdecke mit Nonius-Abhängern, 12,5mm GKB, gespachtelt Q3",
				},
				quantity: 92,
				unitCode: "MTK",
				netPrice: 62,
				taxCategoryCode: "AE",
				taxRate: 0,
				exemptionReason:
					"Steuerschuldnerschaft des Leistungsempfängers gemäß §13b Abs. 2 Nr. 4 UStG",
				lineTotalAmount: 5704,
			},
			{
				lineId: "3",
				product: {
					name: "Brandschutzverkleidung Stahlträger F90",
					description:
						"Brandschutzbekleidung Stahlträger HEB 200, F90, 2-lagig GKF 12,5mm",
				},
				quantity: 38,
				unitCode: "MTR",
				netPrice: 125,
				taxCategoryCode: "AE",
				taxRate: 0,
				exemptionReason:
					"Steuerschuldnerschaft des Leistungsempfängers gemäß §13b Abs. 2 Nr. 4 UStG",
				lineTotalAmount: 4750,
			},
		],
		paymentMeans: {
			typeCode: "58",
			payeeAccount: { iban: "DE44500105175407324931", bic: "INGDDEFFXXX" },
		},
		paymentTerms: [
			{ description: "Zahlbar innerhalb 30 Tagen netto", dueDate: "20260619" },
		],
		notes: [
			{
				content:
					"Steuerschuldnerschaft des Leistungsempfängers gemäß §13b Abs. 2 Nr. 4 UStG (Bauleistungen)",
				subjectCode: "AAI",
			},
		],
		taxBreakdown: [
			{
				categoryCode: "AE",
				ratePercent: 0,
				basisAmount: 17486.5,
				calculatedAmount: 0,
				exemptionReason:
					"Steuerschuldnerschaft des Leistungsempfängers gemäß §13b Abs. 2 Nr. 4 UStG",
			},
		],
		totals: {
			lineTotalAmount: 17486.5,
			taxBasisTotalAmount: 17486.5,
			taxTotalAmount: 0,
			grandTotalAmount: 17486.5,
			duePayableAmount: 17486.5,
		},
	};
}

function kleinunternehmerHandwerker(): ZugferdInvoice {
	return {
		invoiceNumber: "2026-0089",
		typeCode: "380",
		issueDate: "20260510",
		currency: "EUR",
		deliveryDate: "20260509",
		seller: {
			name: "Thomas Strack Malermeister",
			address: {
				lineOne: "Jahnstraße 15",
				city: "Edigheim",
				postalCode: "67069",
				countryCode: "DE",
			},
			contact: {
				name: "Thomas Strack",
				phone: "+49 621 55443322",
				email: "info@maler-strack.de",
			},
			taxRegistrations: [{ id: "086/567/12345", schemeId: "FC" }],
		},
		buyer: {
			name: "Familie Weber",
			address: {
				lineOne: "Gartenweg 3",
				city: "Ludwigshafen am Rhein",
				postalCode: "67061",
				countryCode: "DE",
			},
		},
		lines: [
			{
				lineId: "1",
				product: {
					name: "Malerarbeiten Wohnzimmer",
					description:
						"Wände und Decke grundieren und 2x streichen, Dispersionsfarbe weiß, ca. 65 m²",
				},
				quantity: 65,
				unitCode: "MTK",
				netPrice: 12.5,
				taxCategoryCode: "E",
				taxRate: 0,
				exemptionReason:
					"Kein Ausweis von Umsatzsteuer, da Kleinunternehmer gemäß §19 UStG",
				lineTotalAmount: 812.5,
			},
			{
				lineId: "2",
				product: {
					name: "Malerarbeiten Schlafzimmer",
					description:
						"Wände grundieren und 2x streichen, Dispersionsfarbe RAL 9010, ca. 48 m²",
				},
				quantity: 48,
				unitCode: "MTK",
				netPrice: 12.5,
				taxCategoryCode: "E",
				taxRate: 0,
				exemptionReason:
					"Kein Ausweis von Umsatzsteuer, da Kleinunternehmer gemäß §19 UStG",
				lineTotalAmount: 600,
			},
			{
				lineId: "3",
				product: {
					name: "Lackierarbeiten Türen",
					description:
						"6 Stück Zimmertüren schleifen, grundieren und 2x lackieren, weiß seidenmatt",
				},
				quantity: 6,
				unitCode: "H87",
				netPrice: 85,
				taxCategoryCode: "E",
				taxRate: 0,
				exemptionReason:
					"Kein Ausweis von Umsatzsteuer, da Kleinunternehmer gemäß §19 UStG",
				lineTotalAmount: 510,
			},
			{
				lineId: "4",
				product: {
					name: "Material pauschal",
					description: "Farbe, Grundierung, Lack, Abdeckmaterial, Klebeband",
				},
				quantity: 1,
				unitCode: "LS",
				netPrice: 380,
				taxCategoryCode: "E",
				taxRate: 0,
				exemptionReason:
					"Kein Ausweis von Umsatzsteuer, da Kleinunternehmer gemäß §19 UStG",
				lineTotalAmount: 380,
			},
		],
		paymentMeans: {
			typeCode: "58",
			payeeAccount: { iban: "DE67500105171234567890" },
		},
		paymentTerms: [
			{
				description: "Zahlbar innerhalb 14 Tagen ohne Abzug",
				dueDate: "20260524",
			},
		],
		notes: [
			{
				content: "Gemäß §19 UStG wird keine Umsatzsteuer berechnet.",
				subjectCode: "AAI",
			},
		],
		taxBreakdown: [
			{
				categoryCode: "E",
				ratePercent: 0,
				basisAmount: 2302.5,
				calculatedAmount: 0,
				exemptionReason:
					"Kein Ausweis von Umsatzsteuer, da Kleinunternehmer gemäß §19 UStG",
			},
		],
		totals: {
			lineTotalAmount: 2302.5,
			taxBasisTotalAmount: 2302.5,
			taxTotalAmount: 0,
			grandTotalAmount: 2302.5,
			duePayableAmount: 2302.5,
		},
	};
}

describe("E2E: realistic German construction invoices", () => {
	describe("Abschlagsrechnung (1. Teilrechnung Rohbau)", () => {
		const invoice = bauAbschlagsrechnung();

		it("passes validation", () => {
			const result = validateInvoice(invoice);
			expect(result.valid).toBe(true);
			expect(result.errors).toHaveLength(0);
		});

		it("produces well-formed EXTENDED XML", () => {
			const xml = generateXml(invoice);
			expect(xml).toMatch(/^<\?xml/);
			expect(xml).toContain(
				"urn:cen.eu:en16931:2017#conformant#urn:factur-x.eu:1p0:extended",
			);
			expect(xml).toContain("<ram:TypeCode>875</ram:TypeCode>");
			expect(xml).toContain("<ram:ID>AR-2026-042</ram:ID>");
		});

		it("contains seller and buyer party data", () => {
			const xml = generateXml(invoice);
			expect(xml).toContain("<ram:Name>Duvnjak Bau GmbH</ram:Name>");
			expect(xml).toContain(
				"<ram:Name>Kraus Immobilien GmbH &amp; Co. KG</ram:Name>",
			);
			expect(xml).toContain("DE312345671");
			expect(xml).toContain('schemeID="VA"');
			expect(xml).toContain('schemeID="FC"');
			expect(xml).toContain("<ram:PersonName>Domagoj Duvnjak</ram:PersonName>");
		});

		it("contains all 7 line items with correct units", () => {
			const xml = generateXml(invoice);
			expect(xml).toContain('unitCode="MTQ"');
			expect(xml).toContain('unitCode="MTK"');
			expect(xml).toContain('unitCode="HUR"');
			expect(xml).toContain('unitCode="LS"');
			expect(xml).toContain(
				"<ram:Name>Erdarbeiten und Baugrubenaushub</ram:Name>",
			);
			expect(xml).toContain(
				"<ram:Name>Baustelleneinrichtung pauschal</ram:Name>",
			);
		});

		it("computes correct totals (7 positions, all 19%)", () => {
			const xml = generateXml(invoice);
			const expectedLineTotal =
				450 * 28.5 +
				185.5 * 95 +
				320 * 72 +
				195 * 115 +
				680 * 12.8 +
				24 * 62 +
				1 * 4500;
			expect(xml).toContain(
				`<ram:LineTotalAmount>${expectedLineTotal.toFixed(2)}</ram:LineTotalAmount>`,
			);
			expect(xml).toContain("<ram:CategoryCode>S</ram:CategoryCode>");
			expect(xml).toContain(
				"<ram:RateApplicablePercent>19.00</ram:RateApplicablePercent>",
			);
		});

		it("contains payment terms with Skonto", () => {
			const xml = generateXml(invoice);
			expect(xml).toContain("3% Skonto");
			expect(xml).toContain(
				"<ram:CalculationPercent>3.00</ram:CalculationPercent>",
			);
			expect(xml).toContain("Zahlbar ohne Abzug");
		});

		it("contains project and contract references", () => {
			const xml = generateXml(invoice);
			expect(xml).toContain("<ram:ID>PRJ-HS7</ram:ID>");
			expect(xml).toContain(
				"<ram:Name>Neubau Mehrfamilienhaus Hauptstraße 7</ram:Name>",
			);
			expect(xml).toContain("BV-2026-003");
		});

		it("contains billing period and delivery date", () => {
			const xml = generateXml(invoice);
			expect(xml).toContain("20260401");
			expect(xml).toContain("20260514");
		});

		it("embeds into PDF with valid ZUGFeRD structure", async () => {
			const doc = await PDFDocument.create();
			doc.addPage([595, 842]);
			const pdfBytes = await doc.save();

			const result = await generateZugferd(invoice, pdfBytes);
			expect(result.validationErrors).toHaveLength(0);
			expect(result.xml.length).toBeGreaterThan(1000);
			expect(result.pdfBuffer.length).toBeGreaterThan(pdfBytes.length);

			const loaded = await PDFDocument.load(result.pdfBuffer);
			expect(loaded.catalog.lookup(PDFName.of("AF"))).toBeDefined();
		}, 15000);
	});

	describe("Schlussrechnung mit 2 Abschlagszahlungen", () => {
		const invoice = schlussrechnungMitAbschlag();

		it("passes validation", () => {
			const result = validateInvoice(invoice);
			expect(result.valid).toBe(true);
			expect(result.errors).toHaveLength(0);
		});

		it("contains TypeCode 877 and preceding invoice references", () => {
			const xml = generateXml(invoice);
			expect(xml).toContain("<ram:TypeCode>877</ram:TypeCode>");
			expect(xml).toContain("AR-2026-042");
			expect(xml).toContain("AR-2026-067");
		});

		it("contains advance payments with tax breakdown and invoice refs", () => {
			const xml = generateXml(invoice);
			expect(xml).toContain("<ram:PaidAmount>65000.00</ram:PaidAmount>");
			expect(xml).toContain("<ram:PaidAmount>45000.00</ram:PaidAmount>");
			expect(xml).toContain("20260601");
			expect(xml).toContain("20260701");
		});

		it("computes prepaid total and due amount correctly", () => {
			const xml = generateXml(invoice);
			expect(xml).toContain(
				"<ram:TotalPrepaidAmount>110000.00</ram:TotalPrepaidAmount>",
			);
			expect(xml).toContain(
				"<ram:DuePayableAmount>110100.62</ram:DuePayableAmount>",
			);
		});
	});

	describe("§13b Reverse Charge (Subunternehmer Trockenbau)", () => {
		const invoice = reverseChargeSubunternehmer();

		it("passes validation including BR-AE rules", () => {
			const result = validateInvoice(invoice);
			expect(result.valid).toBe(true);
			expect(result.errors).toHaveLength(0);
		});

		it("contains AE category with zero tax", () => {
			const xml = generateXml(invoice);
			expect(xml).toContain("<ram:CategoryCode>AE</ram:CategoryCode>");
			expect(xml).not.toContain(
				"<ram:RateApplicablePercent>19.00</ram:RateApplicablePercent>",
			);
		});

		it("contains §13b exemption reason", () => {
			const xml = generateXml(invoice);
			expect(xml).toContain("13b");
		});

		it("computes correct totals with zero VAT", () => {
			const xml = generateXml(invoice);
			const lineTotal = 145 * 48.5 + 92 * 62 + 38 * 125;
			expect(xml).toContain(
				`<ram:LineTotalAmount>${lineTotal.toFixed(2)}</ram:LineTotalAmount>`,
			);
			expect(xml).toContain(
				`<ram:GrandTotalAmount>${lineTotal.toFixed(2)}</ram:GrandTotalAmount>`,
			);
			expect(xml).toContain(
				`<ram:DuePayableAmount>${lineTotal.toFixed(2)}</ram:DuePayableAmount>`,
			);
		});

		it("both seller and buyer have VAT-IDs", () => {
			const xml = generateXml(invoice);
			expect(xml).toContain("DE287654324");
			expect(xml).toContain("DE312345671");
		});
	});

	describe("§19 Kleinunternehmer (Malerarbeiten privat)", () => {
		const invoice = kleinunternehmerHandwerker();

		it("passes validation including BR-E rules", () => {
			const result = validateInvoice(invoice);
			expect(result.valid).toBe(true);
			expect(result.errors).toHaveLength(0);
		});

		it("uses Steuernummer (FC) not USt-IdNr (VA)", () => {
			const xml = generateXml(invoice);
			expect(xml).toContain('schemeID="FC"');
			expect(xml).toContain("086/567/12345");
			expect(xml).not.toContain('schemeID="VA"');
		});

		it("contains §19 exemption note", () => {
			const xml = generateXml(invoice);
			expect(xml).toContain("19 UStG");
		});

		it("computes correct totals with zero VAT", () => {
			const xml = generateXml(invoice);
			const lineTotal = 65 * 12.5 + 48 * 12.5 + 6 * 85 + 380;
			expect(xml).toContain(
				`<ram:GrandTotalAmount>${lineTotal.toFixed(2)}</ram:GrandTotalAmount>`,
			);
			expect(xml).toContain(
				`<ram:DuePayableAmount>${lineTotal.toFixed(2)}</ram:DuePayableAmount>`,
			);
		});

		it("generates full PDF/A-3 document", async () => {
			const doc = await PDFDocument.create();
			const page = doc.addPage([595, 842]);
			const font = await doc.embedFont("Helvetica");
			page.drawText("Rechnung 2026-0089 - Malerarbeiten", {
				x: 50,
				y: 750,
				size: 14,
				font,
			});
			page.drawText("Thomas Strack Malermeister", {
				x: 50,
				y: 720,
				size: 11,
				font,
			});
			const pdfBytes = await doc.save();

			const result = await generateZugferd(invoice, pdfBytes);
			expect(result.validationErrors).toHaveLength(0);
			expect(result.pdfBuffer.length).toBeGreaterThan(pdfBytes.length);

			const loaded = await PDFDocument.load(result.pdfBuffer);
			expect(loaded.getPageCount()).toBe(1);

			const xmlInPdf = result.xml;
			expect(xmlInPdf).toContain("Thomas Strack Malermeister");
			expect(xmlInPdf).toContain("Familie Weber");
			expect(xmlInPdf).toContain("Malerarbeiten Wohnzimmer");
		}, 15000);
	});
});
