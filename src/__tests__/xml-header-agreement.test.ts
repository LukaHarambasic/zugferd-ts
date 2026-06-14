import { describe, expect, it } from "vitest";
import type { ZugferdInvoice } from "../types/index";
import { createCiiDocument, serializeXml } from "../xml/builder";
import { buildHeaderTradeAgreement } from "../xml/header-agreement";

const minimalInvoice: Omit<ZugferdInvoice, "lines"> & { lines: [] } = {
	invoiceNumber: "2025-001",
	typeCode: "380",
	issueDate: "20250101",
	currency: "EUR",
	seller: {
		name: "Musterbetrieb GmbH",
		address: { countryCode: "DE" },
	},
	buyer: {
		name: "Bauherr AG",
		address: { countryCode: "DE" },
	},
	paymentMeans: { typeCode: "58" },
	lines: [],
};

function buildXml(invoice: ZugferdInvoice): string {
	const root = createCiiDocument();
	buildHeaderTradeAgreement(root, invoice);
	return serializeXml(root);
}

describe("ZF-009 header trade agreement XML", () => {
	it("1 — BuyerReference present", () => {
		const xml = buildXml({
			...minimalInvoice,
			buyerReference: "PO-12345",
		} as unknown as ZugferdInvoice);
		expect(xml).toContain("<ram:BuyerReference>PO-12345</ram:BuyerReference>");
	});

	it("2 — seller and buyer parties rendered", () => {
		const xml = buildXml(minimalInvoice as unknown as ZugferdInvoice);
		expect(xml).toContain("<ram:SellerTradeParty>");
		expect(xml).toContain("<ram:Name>Musterbetrieb GmbH</ram:Name>");
		expect(xml).toContain("<ram:BuyerTradeParty>");
		expect(xml).toContain("<ram:Name>Bauherr AG</ram:Name>");
	});

	it("3 — optional references: seller order, buyer order, contract", () => {
		const xml = buildXml({
			...minimalInvoice,
			salesOrderReference: "SO-001",
			purchaseOrderReference: "PO-001",
			contractReference: "V-2024",
		} as unknown as ZugferdInvoice);
		expect(xml).toContain("<ram:SellerOrderReferencedDocument>");
		expect(xml).toContain(
			"<ram:IssuerAssignedID>SO-001</ram:IssuerAssignedID>",
		);
		expect(xml).toContain("<ram:BuyerOrderReferencedDocument>");
		expect(xml).toContain(
			"<ram:IssuerAssignedID>PO-001</ram:IssuerAssignedID>",
		);
		expect(xml).toContain("<ram:ContractReferencedDocument>");
		expect(xml).toContain(
			"<ram:IssuerAssignedID>V-2024</ram:IssuerAssignedID>",
		);
	});

	it("4 — tender reference (TypeCode 50) and invoiced object (TypeCode 130)", () => {
		const xml = buildXml({
			...minimalInvoice,
			tenderReference: "AUS-2023-005",
			invoicedObjectIdentifier: { id: "OBJ-001", schemeId: "7" },
		} as unknown as ZugferdInvoice);
		expect(xml).toContain(
			"<ram:IssuerAssignedID>AUS-2023-005</ram:IssuerAssignedID>",
		);
		expect(xml).toContain("<ram:TypeCode>50</ram:TypeCode>");
		expect(xml).toContain("OBJ-001");
		expect(xml).toContain("<ram:TypeCode>130</ram:TypeCode>");
	});

	it("5 — supporting document with TypeCode 916", () => {
		const xml = buildXml({
			...minimalInvoice,
			supportingDocuments: [
				{
					id: "DOC-001",
					description: "Aufmaßblatt",
					uri: "https://example.com/aufmass.pdf",
				},
			],
		} as unknown as ZugferdInvoice);
		expect(xml).toContain(
			"<ram:IssuerAssignedID>DOC-001</ram:IssuerAssignedID>",
		);
		expect(xml).toContain("<ram:TypeCode>916</ram:TypeCode>");
		expect(xml).toContain("<ram:Name>Aufmaßblatt</ram:Name>");
		expect(xml).toContain(
			"<ram:URIID>https://example.com/aufmass.pdf</ram:URIID>",
		);
	});

	it("6 — project with ID and Name", () => {
		const xml = buildXml({
			...minimalInvoice,
			projectReference: "PRJ-001",
			projectName: "Neubau Hauptstraße",
		} as unknown as ZugferdInvoice);
		expect(xml).toContain("<ram:SpecifiedProcuringProject>");
		expect(xml).toContain("<ram:ID>PRJ-001</ram:ID>");
		expect(xml).toContain("<ram:Name>Neubau Hauptstraße</ram:Name>");
	});

	it("7 — missing optional references produce no elements", () => {
		const xml = buildXml(minimalInvoice as unknown as ZugferdInvoice);
		expect(xml).not.toContain("<ram:SellerOrderReferencedDocument>");
		expect(xml).not.toContain("<ram:BuyerOrderReferencedDocument>");
		expect(xml).not.toContain("<ram:ContractReferencedDocument>");
		expect(xml).not.toContain("<ram:AdditionalReferencedDocument>");
		expect(xml).not.toContain("<ram:SpecifiedProcuringProject>");
	});
});
