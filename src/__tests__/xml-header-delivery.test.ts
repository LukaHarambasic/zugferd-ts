import { describe, expect, it } from "vitest";
import type { ZugferdInvoice } from "../types/index";
import { createCiiDocument, serializeXml } from "../xml/builder";
import { buildHeaderTradeDelivery } from "../xml/header-delivery";

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
	buildHeaderTradeDelivery(root, invoice);
	return serializeXml(root);
}

describe("ZF-009 header trade delivery XML", () => {
	it("1 — ship-to party with address", () => {
		const xml = buildXml({
			...minimalInvoice,
			shipTo: {
				name: "Baustelle Nord",
				address: {
					lineOne: "Bauplatz 7",
					city: "Hamburg",
					postalCode: "20099",
					countryCode: "DE",
				},
			},
		} as unknown as ZugferdInvoice);
		expect(xml).toContain("<ram:ShipToTradeParty>");
		expect(xml).toContain("<ram:Name>Baustelle Nord</ram:Name>");
		expect(xml).toContain("<ram:LineOne>Bauplatz 7</ram:LineOne>");
	});

	it("2 — delivery date formatted correctly", () => {
		const xml = buildXml({
			...minimalInvoice,
			deliveryDate: "20250530",
		} as unknown as ZugferdInvoice);
		expect(xml).toContain(
			'<udt:DateTimeString format="102">20250530</udt:DateTimeString>',
		);
	});

	it("3 — despatch and receiving advice references", () => {
		const xml = buildXml({
			...minimalInvoice,
			despatchAdviceReference: "LA-2024-001",
			receivingAdviceReference: "WE-2024-001",
		} as unknown as ZugferdInvoice);
		expect(xml).toContain("<ram:DespatchAdviceReferencedDocument>");
		expect(xml).toContain(
			"<ram:IssuerAssignedID>LA-2024-001</ram:IssuerAssignedID>",
		);
		expect(xml).toContain("<ram:ReceivingAdviceReferencedDocument>");
		expect(xml).toContain(
			"<ram:IssuerAssignedID>WE-2024-001</ram:IssuerAssignedID>",
		);
	});

	it("4 — no optional elements when all are absent", () => {
		const xml = buildXml(minimalInvoice as unknown as ZugferdInvoice);
		expect(xml).toContain("ram:ApplicableHeaderTradeDelivery");
		expect(xml).not.toContain("<ram:ShipToTradeParty>");
		expect(xml).not.toContain("<ram:ActualDeliverySupplyChainEvent>");
		expect(xml).not.toContain("<ram:DespatchAdviceReferencedDocument>");
		expect(xml).not.toContain("<ram:ReceivingAdviceReferencedDocument>");
	});
});
