import { describe, expect, it } from "vitest";
import type { TransactionCalculationResult } from "../calculation/transaction-calculator";
import type { ZugferdInvoice } from "../types/index";
import type { MonetarySummation } from "../types/settlement";
import { createCiiDocument, serializeXml } from "../xml/builder";
import { buildHeaderTradeSettlement } from "../xml/header-settlement";

const minimalInvoice: ZugferdInvoice = {
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

const minimalCalcResult: TransactionCalculationResult = {
	lineResults: [],
	vatBreakdowns: [],
	totals: {
		lineTotalAmount: 0,
		taxBasisTotalAmount: 0,
		taxTotalAmount: 0,
		grandTotalAmount: 0,
		duePayableAmount: 0,
	},
};

function buildXml(
	invoice: ZugferdInvoice,
	calcResult: TransactionCalculationResult,
): string {
	const root = createCiiDocument();
	buildHeaderTradeSettlement(root, invoice, calcResult);
	return serializeXml(root);
}

describe("ZF-009 header trade settlement XML", () => {
	it("1 — full Abschlagsrechnung (spec reference numbers)", () => {
		const totals: MonetarySummation = {
			lineTotalAmount: 3600,
			chargeTotalAmount: 0,
			allowanceTotalAmount: 0,
			taxBasisTotalAmount: 3600,
			taxTotalAmount: 684,
			grandTotalAmount: 4284,
			totalPrepaidAmount: 0,
			duePayableAmount: 4284,
		};
		const calcResult: TransactionCalculationResult = {
			lineResults: [],
			vatBreakdowns: [
				{
					basisAmount: 3600,
					calculatedAmount: 684,
					categoryCode: "S",
					ratePercent: 19,
				},
			],
			totals,
		};
		const invoice: ZugferdInvoice = {
			...minimalInvoice,
			paymentReference: "RE-AB-2025-001",
			paymentMeans: {
				typeCode: "58",
				payeeAccount: {
					iban: "DE75512108001245126199",
					accountName: "Rechnungsempfänger AG",
					bic: "PBNKDEFF",
				},
			},
			billingPeriod: { startDate: "20250513", endDate: "20250530" },
			paymentTerms: [
				{
					description:
						"Bei Zahlung bis zum 06.06.2025 zahlen Sie mit 2,50 % Skonto € 4.176,90",
					dueDate: "20250606",
					cashDiscount: { basisAmount: 4284, calculationPercent: 2.5 },
				},
				{
					description: "Bis zum 13.06.2025 ohne Abzug",
					dueDate: "20250613",
				},
			],
			accountingReference: "Kostenstelle BT-19",
			taxBreakdown: [
				{
					basisAmount: 3600,
					calculatedAmount: 684,
					categoryCode: "S",
					ratePercent: 19,
				},
			],
		};

		const xml = buildXml(invoice, calcResult);

		expect(xml).toContain(
			"<ram:InvoiceCurrencyCode>EUR</ram:InvoiceCurrencyCode>",
		);
		expect(xml).toContain("<ram:TypeCode>58</ram:TypeCode>");
		expect(xml).toContain("<ram:IBANID>DE75512108001245126199</ram:IBANID>");
		expect(xml).toContain(
			"<ram:AccountName>Rechnungsempfänger AG</ram:AccountName>",
		);
		expect(xml).toContain("<ram:BICID>PBNKDEFF</ram:BICID>");
		expect(xml).toContain(
			"<ram:CalculatedAmount>684.00</ram:CalculatedAmount>",
		);
		expect(xml).toContain("<ram:TypeCode>VAT</ram:TypeCode>");
		expect(xml).toContain("<ram:BasisAmount>3600.00</ram:BasisAmount>");
		expect(xml).toContain("<ram:CategoryCode>S</ram:CategoryCode>");
		expect(xml).toContain(
			"<ram:RateApplicablePercent>19.00</ram:RateApplicablePercent>",
		);
		expect(xml).toContain(
			'<udt:DateTimeString format="102">20250513</udt:DateTimeString>',
		);
		expect(xml).toContain(
			'<udt:DateTimeString format="102">20250530</udt:DateTimeString>',
		);
		expect(xml).toContain("<ram:Description>Bei Zahlung bis zum 06.06.2025");
		expect(xml).toContain(
			'<udt:DateTimeString format="102">20250606</udt:DateTimeString>',
		);
		expect(xml).toContain("<ram:BasisAmount>4284.00</ram:BasisAmount>");
		expect(xml).toContain(
			"<ram:CalculationPercent>2.50</ram:CalculationPercent>",
		);
		expect(xml).toContain(
			"<ram:Description>Bis zum 13.06.2025 ohne Abzug</ram:Description>",
		);
		expect(xml).toContain(
			'<udt:DateTimeString format="102">20250613</udt:DateTimeString>',
		);
		expect(xml).toContain("<ram:LineTotalAmount>3600.00</ram:LineTotalAmount>");
		expect(xml).toContain(
			"<ram:ChargeTotalAmount>0.00</ram:ChargeTotalAmount>",
		);
		expect(xml).toContain(
			"<ram:AllowanceTotalAmount>0.00</ram:AllowanceTotalAmount>",
		);
		expect(xml).toContain(
			"<ram:TaxBasisTotalAmount>3600.00</ram:TaxBasisTotalAmount>",
		);
		expect(xml).toContain('currencyID="EUR"');
		expect(xml).toContain(
			'<ram:TaxTotalAmount currencyID="EUR">684.00</ram:TaxTotalAmount>',
		);
		expect(xml).toContain(
			"<ram:GrandTotalAmount>4284.00</ram:GrandTotalAmount>",
		);
		expect(xml).toContain(
			"<ram:TotalPrepaidAmount>0.00</ram:TotalPrepaidAmount>",
		);
		expect(xml).toContain(
			"<ram:DuePayableAmount>4284.00</ram:DuePayableAmount>",
		);
		expect(xml).toContain("<ram:ID>Kostenstelle BT-19</ram:ID>");
	});

	it("2 — Schlussrechnung with advance payments", () => {
		const totals: MonetarySummation = {
			lineTotalAmount: 16779,
			taxBasisTotalAmount: 16779,
			taxTotalAmount: 2679,
			grandTotalAmount: 19458,
			totalPrepaidAmount: 10000,
			duePayableAmount: 6779,
		};
		const calcResult: TransactionCalculationResult = {
			lineResults: [],
			vatBreakdowns: [
				{
					basisAmount: 16779,
					calculatedAmount: 2679,
					categoryCode: "S",
					ratePercent: 19,
				},
			],
			totals,
		};
		const invoice: ZugferdInvoice = {
			...minimalInvoice,
			taxBreakdown: [
				{
					basisAmount: 16779,
					calculatedAmount: 2679,
					categoryCode: "S",
					ratePercent: 19,
				},
			],
			advancePayments: [
				{
					paidAmount: 4284,
					receivedDate: "20250610",
					includedTax: {
						calculatedAmount: 684,
						typeCode: "VAT",
						categoryCode: "S",
						ratePercent: 19,
					},
					invoiceReference: {
						id: "AR 210111",
						typeCode: "875",
						issueDate: "20250530",
					},
				},
				{
					paidAmount: 5716,
					receivedDate: "20250701",
					includedTax: {
						calculatedAmount: 913,
						typeCode: "VAT",
						categoryCode: "S",
						ratePercent: 19,
					},
					invoiceReference: {
						id: "AR 210112",
						typeCode: "875",
						issueDate: "20250610",
					},
				},
			],
		};

		const xml = buildXml(invoice, calcResult);

		expect(xml).toContain(
			"<ram:TotalPrepaidAmount>10000.00</ram:TotalPrepaidAmount>",
		);
		expect(xml).toContain(
			"<ram:DuePayableAmount>6779.00</ram:DuePayableAmount>",
		);
		const advCount = (xml.match(/<ram:SpecifiedAdvancePayment>/g) ?? []).length;
		expect(advCount).toBe(2);
		expect(xml).toContain("<ram:PaidAmount>4284.00</ram:PaidAmount>");
		expect(xml).toContain(
			'<qdt:DateTimeString format="102">20250610</qdt:DateTimeString>',
		);
		expect(xml).toContain(
			"<ram:IssuerAssignedID>AR 210111</ram:IssuerAssignedID>",
		);
		expect(xml).toContain("<ram:TypeCode>875</ram:TypeCode>");
		expect(xml).toContain(
			'<qdt:DateTimeString format="102">20250530</qdt:DateTimeString>',
		);
		expect(xml).toContain("<ram:PaidAmount>5716.00</ram:PaidAmount>");
		expect(xml).not.toContain("<udt:DateTimeString");
	});

	it("3 — multiple payment terms (Skonto + net)", () => {
		const calcResult: TransactionCalculationResult = {
			...minimalCalcResult,
			totals: {
				lineTotalAmount: 1000,
				taxBasisTotalAmount: 1000,
				taxTotalAmount: 190,
				grandTotalAmount: 1190,
				duePayableAmount: 1190,
			},
		};
		const invoice: ZugferdInvoice = {
			...minimalInvoice,
			paymentTerms: [
				{
					description: "Skonto",
					dueDate: "20250606",
					cashDiscount: { basisAmount: 1190, calculationPercent: 2.5 },
				},
				{
					description: "Netto",
					dueDate: "20250613",
				},
			],
		};

		const xml = buildXml(invoice, calcResult);

		const termCount = (xml.match(/<ram:SpecifiedTradePaymentTerms>/g) ?? [])
			.length;
		expect(termCount).toBe(2);
		expect(xml).toContain("<ram:ApplicableTradePaymentDiscountTerms>");
		const firstTermEnd = xml.indexOf("</ram:SpecifiedTradePaymentTerms>");
		const secondTermStart = xml.indexOf(
			"<ram:SpecifiedTradePaymentTerms>",
			xml.indexOf("<ram:SpecifiedTradePaymentTerms>") + 1,
		);
		const secondBlock = xml.slice(secondTermStart);
		expect(secondBlock).not.toContain(
			"<ram:ApplicableTradePaymentDiscountTerms>",
		);
		expect(firstTermEnd).toBeGreaterThan(0);
	});

	it("4 — direct debit (TypeCode 59)", () => {
		const invoice: ZugferdInvoice = {
			...minimalInvoice,
			paymentMeans: {
				typeCode: "59",
				payerAccount: {
					iban: "DE21700519953762991816",
					mandateReference: "MANDATE-001",
				},
			},
			paymentTerms: [{ directDebitMandateId: "MANDATE-001" }],
		};

		const xml = buildXml(invoice, minimalCalcResult);

		expect(xml).toContain("<ram:TypeCode>59</ram:TypeCode>");
		expect(xml).toContain("<ram:PayerPartyDebtorFinancialAccount>");
		expect(xml).toContain("<ram:IBANID>DE21700519953762991816</ram:IBANID>");
		expect(xml).toContain(
			"<ram:DirectDebitMandateID>MANDATE-001</ram:DirectDebitMandateID>",
		);
		expect(xml).not.toContain("<ram:PayeePartyCreditorFinancialAccount>");
	});

	it("5 — document-level allowance", () => {
		const invoice: ZugferdInvoice = {
			...minimalInvoice,
			allowances: [
				{
					actualAmount: 100,
					basisAmount: 1000,
					calculationPercent: 10,
					reason: "Treuerabatt",
					reasonCode: "95",
					taxCategoryCode: "S",
					taxRate: 19,
				},
			],
		};

		const xml = buildXml(invoice, minimalCalcResult);

		expect(xml).toContain("<ram:ChargeIndicator>");
		expect(xml).toContain("<udt:Indicator>false</udt:Indicator>");
		expect(xml).toContain(
			"<ram:CalculationPercent>10.00</ram:CalculationPercent>",
		);
		expect(xml).toContain("<ram:BasisAmount>1000.00</ram:BasisAmount>");
		expect(xml).toContain("<ram:ActualAmount>100.00</ram:ActualAmount>");
		expect(xml).toContain("<ram:ReasonCode>95</ram:ReasonCode>");
		expect(xml).toContain("<ram:Reason>Treuerabatt</ram:Reason>");
		expect(xml).toContain("<ram:CategoryCode>S</ram:CategoryCode>");
		expect(xml).toContain(
			"<ram:RateApplicablePercent>19.00</ram:RateApplicablePercent>",
		);
	});

	it("6 — document-level charge", () => {
		const invoice: ZugferdInvoice = {
			...minimalInvoice,
			charges: [
				{
					actualAmount: 50,
					reason: "Versandkosten",
					reasonCode: "FC",
					taxCategoryCode: "S",
					taxRate: 19,
				},
			],
		};

		const xml = buildXml(invoice, minimalCalcResult);

		expect(xml).toContain("<udt:Indicator>true</udt:Indicator>");
		expect(xml).toContain("<ram:ActualAmount>50.00</ram:ActualAmount>");
		expect(xml).toContain("<ram:Reason>Versandkosten</ram:Reason>");
	});

	it("7 — multiple VAT breakdowns (S 19% + S 7%)", () => {
		const calcResult: TransactionCalculationResult = {
			lineResults: [],
			vatBreakdowns: [
				{
					basisAmount: 1000,
					calculatedAmount: 190,
					categoryCode: "S",
					ratePercent: 19,
				},
				{
					basisAmount: 500,
					calculatedAmount: 35,
					categoryCode: "S",
					ratePercent: 7,
				},
			],
			totals: {
				lineTotalAmount: 1500,
				taxBasisTotalAmount: 1500,
				taxTotalAmount: 225,
				grandTotalAmount: 1725,
				duePayableAmount: 1725,
			},
		};
		const invoice: ZugferdInvoice = {
			...minimalInvoice,
			taxBreakdown: [
				{
					basisAmount: 1000,
					calculatedAmount: 190,
					categoryCode: "S",
					ratePercent: 19,
				},
				{
					basisAmount: 500,
					calculatedAmount: 35,
					categoryCode: "S",
					ratePercent: 7,
				},
			],
		};

		const xml = buildXml(invoice, calcResult);

		const taxCount = (xml.match(/<ram:ApplicableTradeTax>/g) ?? []).length;
		expect(taxCount).toBe(2);
		expect(xml).toContain(
			"<ram:RateApplicablePercent>19.00</ram:RateApplicablePercent>",
		);
		expect(xml).toContain(
			"<ram:RateApplicablePercent>7.00</ram:RateApplicablePercent>",
		);
		expect(xml).toContain(
			"<ram:CalculatedAmount>190.00</ram:CalculatedAmount>",
		);
		expect(xml).toContain("<ram:CalculatedAmount>35.00</ram:CalculatedAmount>");
	});

	it("8 — reverse charge VAT (AE category)", () => {
		const calcResult: TransactionCalculationResult = {
			lineResults: [],
			vatBreakdowns: [
				{
					basisAmount: 5000,
					calculatedAmount: 0,
					categoryCode: "AE",
					ratePercent: undefined,
				},
			],
			totals: {
				lineTotalAmount: 5000,
				taxBasisTotalAmount: 5000,
				taxTotalAmount: 0,
				grandTotalAmount: 5000,
				duePayableAmount: 5000,
			},
		};
		const invoice: ZugferdInvoice = {
			...minimalInvoice,
			taxBreakdown: [
				{
					basisAmount: 5000,
					calculatedAmount: 0,
					categoryCode: "AE",
					exemptionReason: "Steuerschuldnerschaft §13b UStG",
					exemptionReasonCode: "VATEX-EU-AE",
				},
			],
		};

		const xml = buildXml(invoice, calcResult);

		expect(xml).toContain("<ram:CalculatedAmount>0.00</ram:CalculatedAmount>");
		expect(xml).toContain("<ram:CategoryCode>AE</ram:CategoryCode>");
		expect(xml).toContain(
			"<ram:ExemptionReason>Steuerschuldnerschaft §13b UStG</ram:ExemptionReason>",
		);
		expect(xml).not.toContain("<ram:RateApplicablePercent>");
	});

	it("9 — TaxTotalAmount has currencyID attribute", () => {
		const calcResult: TransactionCalculationResult = {
			...minimalCalcResult,
			totals: {
				lineTotalAmount: 3600,
				taxBasisTotalAmount: 3600,
				taxTotalAmount: 684,
				grandTotalAmount: 4284,
				duePayableAmount: 4284,
			},
		};
		const invoice: ZugferdInvoice = { ...minimalInvoice };

		const xml = buildXml(invoice, calcResult);

		expect(xml).toContain(
			'<ram:TaxTotalAmount currencyID="EUR">684.00</ram:TaxTotalAmount>',
		);
		const withoutAttr = xml.match(/<ram:TaxTotalAmount>/);
		expect(withoutAttr).toBeNull();
	});

	it("10 — preceding invoice reference (correction)", () => {
		const invoice: ZugferdInvoice = {
			...minimalInvoice,
			precedingInvoices: [{ reference: "2024-001", issueDate: "20240115" }],
		};

		const xml = buildXml(invoice, minimalCalcResult);

		expect(xml).toContain("<ram:InvoiceReferencedDocument>");
		expect(xml).toContain(
			"<ram:IssuerAssignedID>2024-001</ram:IssuerAssignedID>",
		);
		expect(xml).toContain(
			'<qdt:DateTimeString format="102">20240115</qdt:DateTimeString>',
		);
	});

	it("11 — SEPA direct debit creditor reference (BT-90)", () => {
		const invoice: ZugferdInvoice = {
			...minimalInvoice,
			paymentMeans: {
				typeCode: "59",
				payerAccount: {
					iban: "DE21700519953762991816",
					creditorReference: "DE98ZZZ09999999999",
				},
			},
		};

		const xml = buildXml(invoice, minimalCalcResult);

		expect(xml).toContain(
			"<ram:CreditorReferenceID>DE98ZZZ09999999999</ram:CreditorReferenceID>",
		);
		const creditorPos = xml.indexOf("<ram:CreditorReferenceID>");
		const currencyPos = xml.indexOf("<ram:InvoiceCurrencyCode>");
		expect(creditorPos).toBeLessThan(currencyPos);
	});

	it("12 — tax currency second TaxTotalAmount (BT-111)", () => {
		const calcResult: TransactionCalculationResult = {
			...minimalCalcResult,
			totals: {
				lineTotalAmount: 3600,
				taxBasisTotalAmount: 3600,
				taxTotalAmount: 684,
				taxTotalAmountCurrency: 610,
				grandTotalAmount: 4284,
				duePayableAmount: 4284,
			},
		};
		const invoice: ZugferdInvoice = {
			...minimalInvoice,
			taxCurrency: "GBP",
		};

		const xml = buildXml(invoice, calcResult);

		expect(xml).toContain(
			'<ram:TaxTotalAmount currencyID="EUR">684.00</ram:TaxTotalAmount>',
		);
		expect(xml).toContain(
			'<ram:TaxTotalAmount currencyID="GBP">610.00</ram:TaxTotalAmount>',
		);
		expect(xml).toContain("<ram:TaxCurrencyCode>GBP</ram:TaxCurrencyCode>");
	});
});
