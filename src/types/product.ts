import type { BillingPeriod, CountryCode, Note, SchemedId } from "./common";

export interface InvoiceLine {
	lineId: string;
	parentLineId?: string;
	lineStatusCode?: "GROUP" | "DETAIL" | "INFORMATION";
	product: Product;
	quantity: number;
	unitCode: string;
	netPrice: number;
	netPriceBasisQuantity?: number;
	grossPrice?: GrossPrice;
	taxCategoryCode: string;
	taxRate?: number;
	exemptionReason?: string;
	exemptionReasonCode?: string;
	lineTotalAmount?: number;
	allowances?: LineAllowance[];
	charges?: LineCharge[];
	billingPeriod?: BillingPeriod;
	buyerOrderLineReference?: string;
	buyerOrderReference?: string;
	accountingReference?: string;
	additionalDocumentReference?: string;
	notes?: Note[];
}

export interface Product {
	name: string;
	description?: string;
	sellerAssignedId?: string;
	buyerAssignedId?: string;
	globalId?: SchemedId;
	classifications?: ProductClassification[];
	countryOfOrigin?: CountryCode;
	attributes?: ItemAttribute[];
	allowances?: ProductAllowance[];
	charges?: ProductCharge[];
}

export interface GrossPrice {
	amount: number;
	basisQuantity?: number;
	allowances?: ProductAllowance[];
}

export interface ProductClassification {
	classCode: string;
	listId: string;
	listVersionId?: string;
	className?: string;
}

export interface ItemAttribute {
	name: string;
	value: string;
	typeCode?: string;
}

export interface LineAllowance {
	actualAmount?: number;
	basisAmount?: number;
	calculationPercent?: number;
	reason?: string;
	reasonCode?: string;
}

export interface LineCharge {
	actualAmount?: number;
	basisAmount?: number;
	calculationPercent?: number;
	reason?: string;
	reasonCode?: string;
}

export interface ProductAllowance {
	actualAmount?: number;
	basisAmount?: number;
	calculationPercent?: number;
	reason?: string;
}

export interface ProductCharge {
	actualAmount?: number;
	basisAmount?: number;
	calculationPercent?: number;
	reason?: string;
}
