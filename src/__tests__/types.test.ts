import { describe, expect, it } from "vitest";
import type {
	AdvancePayment,
	AdvancePaymentInvoiceRef,
	AdvancePaymentTax,
	AttachedDocument,
	BankAccount,
	BillingPeriod,
	CashDiscount,
	Contact,
	DebitAccount,
	DocumentAllowance,
	DocumentCharge,
	GrossPrice,
	InvoiceLine,
	ItemAttribute,
	LegalOrganization,
	LineAllowance,
	LineCharge,
	MonetarySummation,
	Note,
	PaymentMeans,
	PaymentTerms,
	PostalAddress,
	PrecedingInvoice,
	Product,
	ProductAllowance,
	ProductCharge,
	ProductClassification,
	SchemedId,
	TaxBreakdown,
	TaxRegistration,
	TaxRepresentative,
	TradeParty,
	ZugferdInvoice,
} from "../types";

const sellerAddress: PostalAddress = {
	lineOne: "Hauptstraße 1",
	city: "Berlin",
	postalCode: "10115",
	countryCode: "DE",
};

const buyerAddress: PostalAddress = {
	lineOne: "Musterweg 5",
	city: "München",
	postalCode: "80331",
	countryCode: "DE",
};

const seller: TradeParty = {
	name: "Musterbetrieb GmbH",
	taxRegistrations: [{ id: "DE123456789", schemeId: "VA" }],
	address: sellerAddress,
};

const buyer: TradeParty = {
	name: "Auftraggeber AG",
	address: buyerAddress,
};

const bankAccount: BankAccount = {
	iban: "DE89370400440532013000",
	bic: "COBADEFFXXX",
	accountName: "Musterbetrieb GmbH",
};

const paymentMeans: PaymentMeans = {
	typeCode: "58",
	payeeAccount: bankAccount,
};

const taxBreakdown: TaxBreakdown = {
	basisAmount: 1000,
	calculatedAmount: 190,
	categoryCode: "S",
	ratePercent: 19,
};

const totals: MonetarySummation = {
	lineTotalAmount: 1000,
	taxBasisTotalAmount: 1000,
	taxTotalAmount: 190,
	grandTotalAmount: 1190,
	duePayableAmount: 1190,
};

const standardLine: InvoiceLine = {
	lineId: "1",
	product: { name: "Bauleistung" },
	quantity: 10,
	unitCode: "HUR",
	netPrice: 100,
	taxCategoryCode: "S",
	taxRate: 19,
	lineTotalAmount: 1000,
};

describe("ZUGFeRD types", () => {
	it("constructs a minimal Abschlagsrechnung (typeCode 875)", () => {
		const invoice: ZugferdInvoice = {
			invoiceNumber: "2026-001",
			typeCode: "875",
			issueDate: "2026-05-31",
			currency: "EUR",
			seller,
			buyer,
			paymentMeans,
			taxBreakdown: [taxBreakdown],
			totals,
			lines: [standardLine],
		};

		expect(invoice.typeCode).toBe("875");
		expect(invoice.invoiceNumber).toBe("2026-001");
		expect(invoice.lines).toHaveLength(1);
	});

	it("constructs a full Schlussrechnung with AdvancePayments (typeCode 877)", () => {
		const precedingInvoice: PrecedingInvoice = {
			reference: "2026-001",
			issueDate: "2026-01-15",
		};

		const advanceTax: AdvancePaymentTax = {
			calculatedAmount: 190,
			typeCode: "VAT",
			categoryCode: "S",
			ratePercent: 19,
		};

		const advanceRef: AdvancePaymentInvoiceRef = {
			id: "2026-001",
			typeCode: "875",
			issueDate: "2026-01-15",
		};

		const advancePayment: AdvancePayment = {
			paidAmount: 1190,
			receivedDate: "2026-01-20",
			includedTax: advanceTax,
			invoiceReference: advanceRef,
		};

		const groupLine: InvoiceLine = {
			lineId: "1",
			lineStatusCode: "GROUP",
			product: { name: "Rohbauarbeiten" },
			quantity: 1,
			unitCode: "C62",
			netPrice: 0,
			taxCategoryCode: "S",
			taxRate: 19,
		};

		const detailLine: InvoiceLine = {
			lineId: "1.1",
			parentLineId: "1",
			lineStatusCode: "DETAIL",
			product: { name: "Maurerarbeiten" },
			quantity: 20,
			unitCode: "HUR",
			netPrice: 50,
			taxCategoryCode: "S",
			taxRate: 19,
			lineTotalAmount: 1000,
		};

		const invoice: ZugferdInvoice = {
			invoiceNumber: "2026-010",
			typeCode: "877",
			issueDate: "2026-05-31",
			currency: "EUR",
			seller,
			buyer,
			paymentMeans,
			precedingInvoices: [precedingInvoice],
			advancePayments: [advancePayment],
			taxBreakdown: [taxBreakdown],
			totals,
			lines: [groupLine, detailLine],
		};

		expect(invoice.typeCode).toBe("877");
		expect(invoice.precedingInvoices).toHaveLength(1);
		expect(invoice.advancePayments).toHaveLength(1);
		expect(invoice.lines[0].lineStatusCode).toBe("GROUP");
		expect(invoice.lines[1].lineStatusCode).toBe("DETAIL");
	});

	it("constructs a reverse charge invoice (§13b UStG / AE category)", () => {
		const note: Note = {
			content: "Steuerschuldnerschaft des Leistungsempfängers",
			subjectCode: "AAI",
		};

		const reverseTax: TaxBreakdown = {
			basisAmount: 5000,
			calculatedAmount: 0,
			categoryCode: "AE",
			ratePercent: 0,
			exemptionReasonCode: "VATEX-EU-AE",
		};

		const reverseTotals: MonetarySummation = {
			lineTotalAmount: 5000,
			taxBasisTotalAmount: 5000,
			taxTotalAmount: 0,
			grandTotalAmount: 5000,
			duePayableAmount: 5000,
		};

		const reverseLine: InvoiceLine = {
			lineId: "1",
			product: { name: "Bauleistung §13b" },
			quantity: 50,
			unitCode: "HUR",
			netPrice: 100,
			taxCategoryCode: "AE",
			taxRate: 0,
			lineTotalAmount: 5000,
		};

		const invoice: ZugferdInvoice = {
			invoiceNumber: "2026-020",
			typeCode: "380",
			issueDate: "2026-05-31",
			currency: "EUR",
			seller,
			buyer,
			paymentMeans,
			notes: [note],
			taxBreakdown: [reverseTax],
			totals: reverseTotals,
			lines: [reverseLine],
		};

		expect(invoice.lines[0].taxCategoryCode).toBe("AE");
		expect(invoice.taxBreakdown?.[0].categoryCode).toBe("AE");
		expect(invoice.notes?.[0].subjectCode).toBe("AAI");
	});

	it("constructs a Kleinunternehmer invoice (§19 UStG / E category)", () => {
		const kleinSeller: TradeParty = {
			name: "Kleinunternehmer Müller",
			taxRegistrations: [{ id: "12/345/67890", schemeId: "FC" }],
			address: sellerAddress,
		};

		const kleinTax: TaxBreakdown = {
			basisAmount: 2000,
			calculatedAmount: 0,
			categoryCode: "E",
			ratePercent: 0,
			exemptionReason: "Umsatzsteuerbefreiung gemäß §19 UStG",
		};

		const kleinTotals: MonetarySummation = {
			lineTotalAmount: 2000,
			taxBasisTotalAmount: 2000,
			taxTotalAmount: 0,
			grandTotalAmount: 2000,
			duePayableAmount: 2000,
		};

		const kleinLine: InvoiceLine = {
			lineId: "1",
			product: { name: "Handwerkerleistung" },
			quantity: 8,
			unitCode: "HUR",
			netPrice: 250,
			taxCategoryCode: "E",
			taxRate: 0,
			lineTotalAmount: 2000,
		};

		const invoice: ZugferdInvoice = {
			invoiceNumber: "2026-030",
			typeCode: "380",
			issueDate: "2026-05-31",
			currency: "EUR",
			seller: kleinSeller,
			buyer,
			paymentMeans,
			taxBreakdown: [kleinTax],
			totals: kleinTotals,
			lines: [kleinLine],
		};

		expect(invoice.lines[0].taxCategoryCode).toBe("E");
		expect(invoice.taxBreakdown?.[0].categoryCode).toBe("E");
		expect(invoice.seller.taxRegistrations?.[0].schemeId).toBe("FC");
	});

	it("barrel export completeness — all types resolve from ../types", () => {
		const address: PostalAddress = { countryCode: "DE" };
		const contact: Contact = { name: "Max Mustermann" };
		const legalOrg: LegalOrganization = { tradingName: "Muster GmbH" };
		const taxReg: TaxRegistration = { id: "DE123", schemeId: "VA" };
		const schemedId: SchemedId = { id: "abc", schemeId: "0088" };
		const billingPeriod: BillingPeriod = {
			startDate: "2026-01-01",
			endDate: "2026-03-31",
		};
		const attachedDoc: AttachedDocument = { id: "DOC-1" };
		const note: Note = { content: "Test note" };
		const taxRep: TaxRepresentative = {
			name: "Steuerberater",
			vatId: "DE999999999",
			address,
		};
		const paymentTerms: PaymentTerms = { description: "30 days net" };
		const docAllowance: DocumentAllowance = {
			actualAmount: 100,
			taxCategoryCode: "S",
		};
		const docCharge: DocumentCharge = {
			actualAmount: 50,
			taxCategoryCode: "S",
		};
		const debitAccount: DebitAccount = { iban: "DE89370400440532013000" };
		const cashDiscount: CashDiscount = { calculationPercent: 2 };
		const grossPrice: GrossPrice = { amount: 100 };
		const productClassification: ProductClassification = {
			classCode: "12345",
			listId: "STI",
		};
		const itemAttribute: ItemAttribute = { name: "Farbe", value: "Blau" };
		const lineAllowance: LineAllowance = { actualAmount: 10 };
		const lineCharge: LineCharge = { actualAmount: 5 };
		const productAllowance: ProductAllowance = { actualAmount: 20 };
		const productCharge: ProductCharge = { actualAmount: 15 };
		const product: Product = { name: "Testprodukt" };

		expect(address.countryCode).toBe("DE");
		expect(contact.name).toBe("Max Mustermann");
		expect(legalOrg.tradingName).toBe("Muster GmbH");
		expect(taxReg.schemeId).toBe("VA");
		expect(schemedId.id).toBe("abc");
		expect(billingPeriod.startDate).toBe("2026-01-01");
		expect(attachedDoc.id).toBe("DOC-1");
		expect(note.content).toBe("Test note");
		expect(taxRep.vatId).toBe("DE999999999");
		expect(paymentTerms.description).toBe("30 days net");
		expect(docAllowance.actualAmount).toBe(100);
		expect(docCharge.actualAmount).toBe(50);
		expect(debitAccount.iban).toBeDefined();
		expect(cashDiscount.calculationPercent).toBe(2);
		expect(grossPrice.amount).toBe(100);
		expect(productClassification.classCode).toBe("12345");
		expect(itemAttribute.name).toBe("Farbe");
		expect(lineAllowance.actualAmount).toBe(10);
		expect(lineCharge.actualAmount).toBe(5);
		expect(productAllowance.actualAmount).toBe(20);
		expect(productCharge.actualAmount).toBe(15);
		expect(product.name).toBe("Testprodukt");
	});
});
