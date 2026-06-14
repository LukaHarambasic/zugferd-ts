import { describe, expect, it } from "vitest";
import type { TradeParty } from "../types/index";
import { createCiiDocument, serializeXml } from "../xml/builder";
import {
	buildContact,
	buildLegalOrganization,
	buildPostalAddress,
	buildTradeParty,
} from "../xml/trade-party";

function buildAndSerialize(party: TradeParty, elementName: string): string {
	const root = createCiiDocument();
	buildTradeParty(root, party, elementName);
	return serializeXml(root);
}

describe("ZF-007 trade party XML", () => {
	it("1 — seller with full details", () => {
		const xml = buildAndSerialize(
			{
				id: "998877",
				name: "Musterbetrieb AG Demodaten",
				legalOrganization: { id: "HRA 45678" },
				contact: {
					name: "Kontaktperson",
					phone: "5578",
					email: "absender@musterberieb.de",
				},
				address: {
					postalCode: "37079",
					lineOne: "August-Spindler-Strasse 20",
					city: "Göttingen",
					countryCode: "DE",
				},
				taxRegistrations: [{ id: "DE09687654321", schemeId: "VA" }],
			},
			"ram:SellerTradeParty",
		);

		expect(xml).toContain("<ram:SellerTradeParty>");
		expect(xml).toContain("<ram:ID>998877</ram:ID>");
		expect(xml).toContain("<ram:Name>Musterbetrieb AG Demodaten</ram:Name>");
		expect(xml).toContain("<ram:SpecifiedLegalOrganization>");
		expect(xml).toContain("<ram:ID>HRA 45678</ram:ID>");
		expect(xml).toContain("<ram:PersonName>Kontaktperson</ram:PersonName>");
		expect(xml).toContain("<ram:CompleteNumber>5578</ram:CompleteNumber>");
		expect(xml).toContain("<ram:URIID>absender@musterberieb.de</ram:URIID>");
		expect(xml).toContain("<ram:PostcodeCode>37079</ram:PostcodeCode>");
		expect(xml).toContain(
			"<ram:LineOne>August-Spindler-Strasse 20</ram:LineOne>",
		);
		expect(xml).toContain("<ram:CityName>Göttingen</ram:CityName>");
		expect(xml).toContain("<ram:CountryID>DE</ram:CountryID>");
		expect(xml).toContain('schemeID="VA"');
		expect(xml).toContain('<ram:ID schemeID="VA">DE09687654321</ram:ID>');
	});

	it("2 — seller with VA + FC registrations", () => {
		const xml = buildAndSerialize(
			{
				name: "Testfirma",
				address: { countryCode: "DE" },
				taxRegistrations: [
					{ id: "DE123456789", schemeId: "VA" },
					{ id: "123/456/78901", schemeId: "FC" },
				],
			},
			"ram:SellerTradeParty",
		);

		expect(xml).toContain('schemeID="VA"');
		expect(xml).toContain('schemeID="FC"');
		expect(xml).toContain("DE123456789");
		expect(xml).toContain("123/456/78901");
		const count = (xml.match(/<ram:SpecifiedTaxRegistration>/g) ?? []).length;
		expect(count).toBe(2);
	});

	it("3 — buyer (business) with contact", () => {
		const xml = buildAndSerialize(
			{
				name: "Bauherr GmbH",
				address: { countryCode: "DE" },
				taxRegistrations: [{ id: "DE987654321", schemeId: "VA" }],
				contact: { name: "Max Muster", email: "max@bauherr.de" },
			},
			"ram:BuyerTradeParty",
		);

		expect(xml).toContain("<ram:BuyerTradeParty>");
		expect(xml).toContain("<ram:Name>Bauherr GmbH</ram:Name>");
		expect(xml).toContain("<ram:PersonName>Max Muster</ram:PersonName>");
	});

	it("4 — buyer (private individual)", () => {
		const xml = buildAndSerialize(
			{
				name: "Hans Privat",
				address: { countryCode: "DE" },
			},
			"ram:BuyerTradeParty",
		);

		expect(xml).toContain("<ram:Name>Hans Privat</ram:Name>");
		expect(xml).not.toContain("<ram:SpecifiedTaxRegistration>");
		expect(xml).not.toContain("<ram:DefinedTradeContact>");
		expect(xml).not.toContain("<ram:SpecifiedLegalOrganization>");
		expect(xml).not.toContain("<ram:ID>");
	});

	it("5 — ship-to party", () => {
		const xml = buildAndSerialize(
			{
				name: "Baustelle Nord",
				address: {
					lineOne: "Bauplatz 7",
					city: "Hamburg",
					postalCode: "20099",
					countryCode: "DE",
				},
			},
			"ram:ShipToTradeParty",
		);

		expect(xml).toContain("<ram:ShipToTradeParty>");
		expect(xml).toContain("<ram:Name>Baustelle Nord</ram:Name>");
		expect(xml).toContain("<ram:LineOne>Bauplatz 7</ram:LineOne>");
		expect(xml).not.toContain("<ram:SpecifiedTaxRegistration>");
	});

	it("6 — tax representative", () => {
		const xml = buildAndSerialize(
			{
				name: "Steuerberater Schulz",
				address: { countryCode: "DE" },
				taxRegistrations: [{ id: "DE999888777", schemeId: "VA" }],
			},
			"ram:SellerTaxRepresentativeTradeParty",
		);

		expect(xml).toContain("<ram:SellerTaxRepresentativeTradeParty>");
		expect(xml).toContain("<ram:Name>Steuerberater Schulz</ram:Name>");
		expect(xml).toContain('<ram:ID schemeID="VA">DE999888777</ram:ID>');
	});

	it("7 — contact with department name (not person name)", () => {
		const root = createCiiDocument();
		buildContact(root, {
			department: "Buchhaltung",
			email: "buchhaltung@firma.de",
		});
		const xml = serializeXml(root);

		expect(xml).toContain(
			"<ram:DepartmentName>Buchhaltung</ram:DepartmentName>",
		);
		expect(xml).not.toContain("<ram:PersonName>");
	});

	it("8 — contact with fax (EXTENDED)", () => {
		const root = createCiiDocument();
		buildContact(root, {
			name: "Erika Muster",
			phone: "+49 30 123456",
			fax: "+49 30 123499",
			email: "e.muster@firma.de",
		});
		const xml = serializeXml(root);

		expect(xml).toContain("<ram:FaxUniversalCommunication>");
		expect(xml).toContain(
			"<ram:CompleteNumber>+49 30 123499</ram:CompleteNumber>",
		);
		expect(xml).toContain(
			"<ram:CompleteNumber>+49 30 123456</ram:CompleteNumber>",
		);
	});

	it("9 — GLN global ID", () => {
		const xml = buildAndSerialize(
			{
				name: "Firma mit GLN",
				address: { countryCode: "DE" },
				globalIds: [{ id: "4333741000005", schemeId: "0088" }],
			},
			"ram:SellerTradeParty",
		);

		expect(xml).toContain(
			'<ram:GlobalID schemeID="0088">4333741000005</ram:GlobalID>',
		);
	});

	it("10 — electronic address", () => {
		const xml = buildAndSerialize(
			{
				name: "Firma mit E-Adresse",
				address: { countryCode: "DE" },
				electronicAddress: { id: "billing@example.de", schemeId: "EM" },
			},
			"ram:SellerTradeParty",
		);

		expect(xml).toContain("<ram:URIUniversalCommunication>");
		expect(xml).toContain(
			'<ram:URIID schemeID="EM">billing@example.de</ram:URIID>',
		);
	});

	it("11 — missing optional fields produce no empty elements", () => {
		const xml = buildAndSerialize(
			{
				name: "Minimalfirma",
				address: { countryCode: "DE" },
			},
			"ram:SellerTradeParty",
		);

		expect(xml).toContain("<ram:Name>Minimalfirma</ram:Name>");
		expect(xml).not.toContain("<ram:ID>");
		expect(xml).not.toContain("<ram:GlobalID");
		expect(xml).not.toContain("<ram:SpecifiedLegalOrganization>");
		expect(xml).not.toContain("<ram:DefinedTradeContact>");
		expect(xml).not.toContain("<ram:SpecifiedTaxRegistration>");
		expect(xml).not.toContain("<ram:URIUniversalCommunication>");
		expect(xml).not.toContain("<ram:Description>");
	});

	it("12 — address with LineTwo and LineThree", () => {
		const root = createCiiDocument();
		buildPostalAddress(root, {
			lineOne: "Hauptstr. 1",
			lineTwo: "c/o Empfang",
			lineThree: "Hinterhaus",
			city: "Berlin",
			postalCode: "10115",
			countryCode: "DE",
		});
		const xml = serializeXml(root);

		expect(xml).toContain("<ram:LineOne>Hauptstr. 1</ram:LineOne>");
		expect(xml).toContain("<ram:LineTwo>c/o Empfang</ram:LineTwo>");
		expect(xml).toContain("<ram:LineThree>Hinterhaus</ram:LineThree>");
	});

	it("13 — legalOrganization with schemeID and tradingName", () => {
		const root = createCiiDocument();
		buildLegalOrganization(root, {
			id: "12345",
			schemeId: "HRB",
			tradingName: "Musterbau",
		});
		const xml = serializeXml(root);

		expect(xml).toContain('<ram:ID schemeID="HRB">12345</ram:ID>');
		expect(xml).toContain(
			"<ram:TradingBusinessName>Musterbau</ram:TradingBusinessName>",
		);
	});
});
