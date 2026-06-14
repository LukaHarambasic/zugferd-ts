import { describe, expect, it } from "vitest";
import type { LineCalculationResult } from "../calculation/types";
import type { InvoiceLine } from "../types/product";
import { createCiiDocument, serializeXml } from "../xml/builder";
import { buildLineItem } from "../xml/line-item";

function makeLine(overrides: Partial<InvoiceLine>): InvoiceLine {
	return {
		lineId: "1",
		product: { name: "Test" },
		quantity: 1,
		unitCode: "C62",
		netPrice: 0,
		taxCategoryCode: "S",
		taxRate: 19,
		...overrides,
	};
}

function makeResult(
	overrides: Partial<LineCalculationResult>,
): LineCalculationResult {
	return {
		lineId: "1",
		grossPricePerUnit: 0,
		netPricePerUnit: 0,
		lineSubtotal: 0,
		itemAllowancesTotal: 0,
		itemChargesTotal: 0,
		lineTotalAmount: 0,
		taxCategoryCode: "S",
		taxRate: 19,
		isCalculationRelevant: true,
		...overrides,
	};
}

function buildXml(line: InvoiceLine, result: LineCalculationResult): string {
	const root = createCiiDocument();
	buildLineItem(root, line, result);
	return serializeXml(root);
}

describe("buildLineItem", () => {
	it("Test 1 — simple construction line", () => {
		const line = makeLine({
			lineId: "01.01",
			product: {
				name: "Baugelände abräumen Anfallender Schutt, Pflanzenreste und Müll entsorgen",
			},
			netPrice: 7,
			quantity: 300,
			unitCode: "H87",
			taxCategoryCode: "S",
			taxRate: 19,
		});
		const result = makeResult({ netPricePerUnit: 7, lineTotalAmount: 2100 });
		const xml = buildXml(line, result);

		expect(xml).toContain("<ram:LineID>01.01</ram:LineID>");
		expect(xml).toContain(
			"<ram:Name>Baugelände abräumen Anfallender Schutt, Pflanzenreste und Müll entsorgen</ram:Name>",
		);
		expect(xml).toContain("<ram:ChargeAmount>7.0000</ram:ChargeAmount>");
		expect(xml).toContain('unitCode="H87"');
		expect(xml).toContain(">300.00<");
		expect(xml).toContain("<ram:TypeCode>VAT</ram:TypeCode>");
		expect(xml).toContain("<ram:CategoryCode>S</ram:CategoryCode>");
		expect(xml).toContain(
			"<ram:RateApplicablePercent>19.00</ram:RateApplicablePercent>",
		);
		expect(xml).toContain("<ram:LineTotalAmount>2100.00</ram:LineTotalAmount>");
	});

	it("Test 2 — square metre line", () => {
		const line = makeLine({
			lineId: "01.02",
			unitCode: "MTK",
			quantity: 250,
			netPrice: 6,
		});
		const result = makeResult({ netPricePerUnit: 6, lineTotalAmount: 1500 });
		const xml = buildXml(line, result);

		expect(xml).toContain('unitCode="MTK"');
		expect(xml).toContain(">250.00<");
		expect(xml).toContain("<ram:ChargeAmount>6.0000</ram:ChargeAmount>");
		expect(xml).toContain("<ram:LineTotalAmount>1500.00</ram:LineTotalAmount>");
	});

	it("Test 3 — gross price with product allowance", () => {
		const line = makeLine({
			grossPrice: {
				amount: 15,
				allowances: [{ actualAmount: 4.5, reason: "Mengenrabatt" }],
			},
			netPrice: 10.5,
		});
		const result = makeResult({
			grossPricePerUnit: 15,
			netPricePerUnit: 10.5,
		});
		const xml = buildXml(line, result);

		expect(xml).toContain("<ram:GrossPriceProductTradePrice>");
		expect(xml).toContain("<ram:ChargeAmount>15.0000</ram:ChargeAmount>");
		expect(xml).toContain("<udt:Indicator>false</udt:Indicator>");
		expect(xml).toContain("<ram:ActualAmount>4.5000</ram:ActualAmount>");
		expect(xml).toContain("<ram:Reason>Mengenrabatt</ram:Reason>");
		expect(xml).toContain("<ram:ChargeAmount>10.5000</ram:ChargeAmount>");
	});

	it("Test 4 — item-level allowance", () => {
		const line = makeLine({
			netPrice: 100,
			quantity: 5,
			allowances: [{ actualAmount: 50, reason: "Rabatt", reasonCode: "95" }],
		});
		const result = makeResult({ lineTotalAmount: 450 });
		const xml = buildXml(line, result);

		expect(xml).toContain("<ram:SpecifiedTradeAllowanceCharge>");
		expect(xml).toContain("<udt:Indicator>false</udt:Indicator>");
		expect(xml).toContain("<ram:ActualAmount>50.00</ram:ActualAmount>");
		expect(xml).toContain("<ram:Reason>Rabatt</ram:Reason>");
		expect(xml).toContain("<ram:ReasonCode>95</ram:ReasonCode>");
		expect(xml).toContain("<ram:LineTotalAmount>450.00</ram:LineTotalAmount>");
	});

	it("Test 5 — item-level charge", () => {
		const line = makeLine({
			netPrice: 100,
			quantity: 5,
			charges: [{ actualAmount: 25, reason: "Kleinmengenzuschlag" }],
		});
		const result = makeResult({ lineTotalAmount: 525 });
		const xml = buildXml(line, result);

		expect(xml).toContain("<udt:Indicator>true</udt:Indicator>");
		expect(xml).toContain("<ram:ActualAmount>25.00</ram:ActualAmount>");
		expect(xml).toContain("<ram:LineTotalAmount>525.00</ram:LineTotalAmount>");
	});

	it("Test 6 — sub-invoice GROUP line", () => {
		const line = makeLine({
			lineId: "1",
			lineStatusCode: "GROUP",
		});
		const result = makeResult({
			isCalculationRelevant: false,
			lineTotalAmount: 5000,
		});
		const xml = buildXml(line, result);

		expect(xml).toContain("<ram:LineStatusCode>DETAIL</ram:LineStatusCode>");
		expect(xml).toContain(
			"<ram:LineStatusReasonCode>GROUP</ram:LineStatusReasonCode>",
		);
		expect(xml).not.toContain("<ram:ParentLineID>");
		expect(xml).toContain("<ram:LineTotalAmount>5000.00</ram:LineTotalAmount>");
	});

	it("Test 7 — sub-invoice DETAIL line with parent", () => {
		const line = makeLine({
			lineId: "1.1",
			parentLineId: "1",
			lineStatusCode: "DETAIL",
			netPrice: 100,
			quantity: 3,
		});
		const result = makeResult({ lineTotalAmount: 300 });
		const xml = buildXml(line, result);

		expect(xml).toContain("<ram:ParentLineID>1</ram:ParentLineID>");
		expect(xml).toContain("<ram:LineStatusCode>DETAIL</ram:LineStatusCode>");
		expect(xml).toContain(
			"<ram:LineStatusReasonCode>DETAIL</ram:LineStatusReasonCode>",
		);
		expect(xml).toContain("<ram:LineTotalAmount>300.00</ram:LineTotalAmount>");
	});

	it("Test 8 — line with billing period", () => {
		const line = makeLine({
			billingPeriod: { startDate: "20240101", endDate: "20240131" },
		});
		const result = makeResult({});
		const xml = buildXml(line, result);

		expect(xml).toContain("<ram:BillingSpecifiedPeriod>");
		expect(xml).toContain(
			'<udt:DateTimeString format="102">20240101</udt:DateTimeString>',
		);
		expect(xml).toContain(
			'<udt:DateTimeString format="102">20240131</udt:DateTimeString>',
		);
	});

	it("Test 9 — product attributes", () => {
		const line = makeLine({
			product: {
				name: "Beton",
				attributes: [{ name: "Güte", value: "C25/30" }],
			},
		});
		const result = makeResult({});
		const xml = buildXml(line, result);

		expect(xml).toContain("<ram:ApplicableProductCharacteristic>");
		expect(xml).toContain("<ram:Description>Güte</ram:Description>");
		expect(xml).toContain("<ram:Value>C25/30</ram:Value>");
	});

	it("Test 10 — product with GTIN global ID", () => {
		const line = makeLine({
			product: {
				name: "Produkt",
				globalId: { id: "0614141000418", schemeId: "0160" },
			},
		});
		const result = makeResult({});
		const xml = buildXml(line, result);

		expect(xml).toContain('schemeID="0160"');
		expect(xml).toContain(">0614141000418<");
	});

	it("Test 11 — buyer order reference", () => {
		const line = makeLine({
			buyerOrderReference: "PO-12345",
			buyerOrderLineReference: "10",
		});
		const result = makeResult({});
		const xml = buildXml(line, result);

		expect(xml).toContain("<ram:BuyerOrderReferencedDocument>");
		expect(xml).toContain(
			"<ram:IssuerAssignedID>PO-12345</ram:IssuerAssignedID>",
		);
		expect(xml).toContain("<ram:LineID>10</ram:LineID>");
	});

	it("Test 12 — line with notes", () => {
		const line = makeLine({
			notes: [{ content: "Qualität geprüft", subjectCode: "AAK" }],
		});
		const result = makeResult({});
		const xml = buildXml(line, result);

		expect(xml).toContain("<ram:IncludedNote>");
		expect(xml).toContain("<ram:Content>Qualität geprüft</ram:Content>");
		expect(xml).toContain("<ram:SubjectCode>AAK</ram:SubjectCode>");
	});

	it("Test 13 — element order matches XSD", () => {
		const line = makeLine({
			product: { name: "Produkt" },
			netPrice: 10,
			quantity: 5,
			taxCategoryCode: "S",
			taxRate: 19,
		});
		const result = makeResult({ netPricePerUnit: 10, lineTotalAmount: 50 });
		const xml = buildXml(line, result);

		const idxDoc = xml.indexOf("AssociatedDocumentLineDocument");
		const idxProduct = xml.indexOf("SpecifiedTradeProduct");
		const idxAgreement = xml.indexOf("SpecifiedLineTradeAgreement");
		const idxDelivery = xml.indexOf("SpecifiedLineTradeDelivery");
		const idxSettlement = xml.indexOf("SpecifiedLineTradeSettlement");

		expect(idxDoc).toBeLessThan(idxProduct);
		expect(idxProduct).toBeLessThan(idxAgreement);
		expect(idxAgreement).toBeLessThan(idxDelivery);
		expect(idxDelivery).toBeLessThan(idxSettlement);
	});
});
