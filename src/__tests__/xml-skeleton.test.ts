import { describe, expect, it } from "vitest";
import type { ZugferdInvoice } from "../types/index";
import { createCiiDocument, serializeXml } from "../xml/builder";
import { buildExchangedDocumentContext } from "../xml/context";
import { buildExchangedDocument } from "../xml/document";
import { EXTENDED_PROFILE_URI, NS } from "../xml/namespaces";

const minimalInvoice: ZugferdInvoice = {
	invoiceNumber: "210111",
	issueDate: "20250530",
	typeCode: "875",
	currency: "EUR",
	seller: {
		name: "Muster GmbH",
		address: {
			lineOne: "Hauptstraße 1",
			city: "München",
			postalCode: "80331",
			countryCode: "DE",
		},
		taxRegistrations: [{ id: "DE123456789", schemeId: "VA" }],
	},
	buyer: {
		name: "Bauherr GmbH",
		address: {
			lineOne: "Kundenstr. 5",
			city: "Hamburg",
			postalCode: "20095",
			countryCode: "DE",
		},
	},
	paymentMeans: { typeCode: "58" },
	lines: [
		{
			lineId: "1",
			product: { name: "Rohbauarbeiten" },
			quantity: 1,
			unitCode: "C62",
			netPrice: 5000,
			taxCategoryCode: "S",
			taxRate: 19,
			lineTotalAmount: 5000,
		},
	],
	totals: {
		lineTotalAmount: 5000,
		taxBasisTotalAmount: 5000,
		taxTotalAmount: 950,
		grandTotalAmount: 5950,
		duePayableAmount: 5950,
	},
	taxBreakdown: [
		{
			basisAmount: 5000,
			calculatedAmount: 950,
			categoryCode: "S",
			ratePercent: 19,
		},
	],
};

describe("ZF-006 XML skeleton", () => {
	it("1 — root element tag", () => {
		const root = createCiiDocument();
		const xml = serializeXml(root);
		expect(xml).toContain("rsm:CrossIndustryInvoice");
	});

	it("2 — all four namespace URIs declared", () => {
		const root = createCiiDocument();
		const xml = serializeXml(root);
		expect(xml).toContain(NS.RSM);
		expect(xml).toContain(NS.RAM);
		expect(xml).toContain(NS.QDT);
		expect(xml).toContain(NS.UDT);
	});

	it("3 — GuidelineID equals EXTENDED URN", () => {
		const root = createCiiDocument();
		buildExchangedDocumentContext(root);
		const xml = serializeXml(root);
		expect(xml).toContain(EXTENDED_PROFILE_URI);
	});

	it("4a — BusinessProcessId present when set", () => {
		const root = createCiiDocument();
		buildExchangedDocumentContext(root, "A1");
		const xml = serializeXml(root);
		expect(xml).toContain("BusinessProcessSpecifiedDocumentContextParameter");
		expect(xml).toContain("<ram:ID>A1</ram:ID>");
	});

	it("4b — BusinessProcessId absent when not set", () => {
		const root = createCiiDocument();
		buildExchangedDocumentContext(root);
		const xml = serializeXml(root);
		expect(xml).not.toContain(
			"BusinessProcessSpecifiedDocumentContextParameter",
		);
	});

	it("5 — invoice number in ram:ID", () => {
		const root = createCiiDocument();
		buildExchangedDocument(root, minimalInvoice);
		const xml = serializeXml(root);
		expect(xml).toContain("<ram:ID>210111</ram:ID>");
	});

	it("6 — TypeCode 875 (Abschlagsrechnung)", () => {
		const root = createCiiDocument();
		buildExchangedDocument(root, minimalInvoice);
		const xml = serializeXml(root);
		expect(xml).toContain("<ram:TypeCode>875</ram:TypeCode>");
	});

	it("7 — TypeCode 877 (Schlussrechnung)", () => {
		const root = createCiiDocument();
		buildExchangedDocument(root, { ...minimalInvoice, typeCode: "877" });
		const xml = serializeXml(root);
		expect(xml).toContain("<ram:TypeCode>877</ram:TypeCode>");
	});

	it("8 — TypeCode 380 (standard invoice)", () => {
		const root = createCiiDocument();
		buildExchangedDocument(root, { ...minimalInvoice, typeCode: "380" });
		const xml = serializeXml(root);
		expect(xml).toContain("<ram:TypeCode>380</ram:TypeCode>");
	});

	it("9 — date with format='102' attribute", () => {
		const root = createCiiDocument();
		buildExchangedDocument(root, minimalInvoice);
		const xml = serializeXml(root);
		expect(xml).toContain('format="102"');
		expect(xml).toContain(">20250530<");
	});

	it("10 — notes with SubjectCode serialize correctly", () => {
		const root = createCiiDocument();
		buildExchangedDocument(root, {
			...minimalInvoice,
			notes: [{ content: "1. Abschlagsrechnung", subjectCode: "ACB" }],
		});
		const xml = serializeXml(root);
		expect(xml).toContain("<ram:Content>1. Abschlagsrechnung</ram:Content>");
		expect(xml).toContain("<ram:SubjectCode>ACB</ram:SubjectCode>");
	});

	it("11 — multiple notes appear in order", () => {
		const root = createCiiDocument();
		buildExchangedDocument(root, {
			...minimalInvoice,
			notes: [{ content: "First note" }, { content: "Second note" }],
		});
		const xml = serializeXml(root);
		expect(xml).toContain("<ram:Content>First note</ram:Content>");
		expect(xml).toContain("<ram:Content>Second note</ram:Content>");
		const firstIdx = xml.indexOf("<ram:Content>First note</ram:Content>");
		const secondIdx = xml.indexOf("<ram:Content>Second note</ram:Content>");
		expect(firstIdx).toBeLessThan(secondIdx);
	});

	it("12a — TestIndicator appears when true", () => {
		const root = createCiiDocument();
		buildExchangedDocument(root, { ...minimalInvoice, testIndicator: true });
		const xml = serializeXml(root);
		expect(xml).toContain("<udt:Indicator>true</udt:Indicator>");
	});

	it("12b — TestIndicator absent when false/undefined", () => {
		const root = createCiiDocument();
		buildExchangedDocument(root, minimalInvoice);
		const xml = serializeXml(root);
		expect(xml).not.toContain("udt:Indicator");
	});

	it("13 — XML declaration present", () => {
		const root = createCiiDocument();
		const xml = serializeXml(root);
		expect(xml.startsWith("<?xml")).toBe(true);
		expect(xml).toContain("encoding=");
	});
});
