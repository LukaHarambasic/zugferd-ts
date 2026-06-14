import type {
	AttachedDocument,
	BillingPeriod,
	CountryCode,
	CurrencyCode,
	DateString,
	Note,
	SchemedId,
} from "./common";
import type { InvoiceLine } from "./product";
import type {
	AdvancePayment,
	DocumentAllowance,
	DocumentCharge,
	MonetarySummation,
	PaymentMeans,
	PaymentTerms,
	TaxBreakdown,
} from "./settlement";

export interface ZugferdInvoice {
	businessProcessId?: string;
	invoiceNumber: string;
	typeCode: string;
	issueDate: DateString;
	currency: CurrencyCode;
	taxCurrency?: CurrencyCode;
	seller: TradeParty;
	buyer: TradeParty;
	payee?: TradeParty;
	sellerTaxRepresentative?: TaxRepresentative;
	shipTo?: TradeParty;
	invoicer?: TradeParty;
	invoicee?: TradeParty;
	buyerReference?: string;
	purchaseOrderReference?: string;
	salesOrderReference?: string;
	contractReference?: string;
	projectReference?: string;
	projectName?: string;
	tenderReference?: string;
	invoicedObjectIdentifier?: SchemedId;
	precedingInvoices?: PrecedingInvoice[];
	deliveryDate?: DateString;
	billingPeriod?: BillingPeriod;
	despatchAdviceReference?: string;
	receivingAdviceReference?: string;
	paymentMeans: PaymentMeans;
	paymentTerms?: PaymentTerms[];
	paymentReference?: string;
	allowances?: DocumentAllowance[];
	charges?: DocumentCharge[];
	totals?: MonetarySummation;
	taxBreakdown?: TaxBreakdown[];
	lines: InvoiceLine[];
	notes?: Note[];
	supportingDocuments?: AttachedDocument[];
	advancePayments?: AdvancePayment[];
	accountingReference?: string;
	testIndicator?: boolean;
	vatDueDateTypeCode?: string;
}

export interface TradeParty {
	name: string;
	id?: string;
	globalIds?: SchemedId[];
	legalOrganization?: LegalOrganization;
	taxRegistrations?: TaxRegistration[];
	address: PostalAddress;
	contact?: Contact;
	electronicAddress?: SchemedId;
	description?: string;
}

export interface PostalAddress {
	lineOne?: string;
	lineTwo?: string;
	lineThree?: string;
	city?: string;
	postalCode?: string;
	countryCode: CountryCode;
	countrySubdivision?: string;
}

export interface Contact {
	name?: string;
	department?: string;
	phone?: string;
	email?: string;
	fax?: string;
}

export interface TaxRegistration {
	id: string;
	schemeId: string;
}

export interface LegalOrganization {
	id?: string;
	schemeId?: string;
	tradingName?: string;
}

export interface TaxRepresentative {
	name: string;
	vatId: string;
	address: PostalAddress;
}

export interface PrecedingInvoice {
	reference: string;
	issueDate?: DateString;
}
