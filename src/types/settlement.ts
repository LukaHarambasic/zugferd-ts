import type { DateString } from "./common";

export interface PaymentMeans {
	typeCode: string;
	information?: string;
	payeeAccount?: BankAccount;
	payerAccount?: DebitAccount;
	cardNumber?: string;
	cardHolder?: string;
}

export interface BankAccount {
	iban?: string;
	proprietaryId?: string;
	accountName?: string;
	bic?: string;
}

export interface DebitAccount {
	iban: string;
	mandateReference?: string;
	creditorReference?: string;
}

export interface PaymentTerms {
	description?: string;
	dueDate?: DateString;
	directDebitMandateId?: string;
	cashDiscount?: CashDiscount;
}

export interface CashDiscount {
	basisAmount?: number;
	calculationPercent: number;
}

export interface DocumentAllowance {
	actualAmount: number;
	basisAmount?: number;
	calculationPercent?: number;
	taxCategoryCode: string;
	taxRate?: number;
	reason?: string;
	reasonCode?: string;
}

export interface DocumentCharge {
	actualAmount: number;
	basisAmount?: number;
	calculationPercent?: number;
	taxCategoryCode: string;
	taxRate?: number;
	reason?: string;
	reasonCode?: string;
}

export interface MonetarySummation {
	lineTotalAmount: number;
	allowanceTotalAmount?: number;
	chargeTotalAmount?: number;
	taxBasisTotalAmount: number;
	taxTotalAmount: number;
	taxTotalAmountCurrency?: number;
	grandTotalAmount: number;
	totalPrepaidAmount?: number;
	roundingAmount?: number;
	duePayableAmount: number;
}

export interface TaxBreakdown {
	basisAmount: number;
	calculatedAmount: number;
	categoryCode: string;
	ratePercent?: number;
	exemptionReason?: string;
	exemptionReasonCode?: string;
	dueDateTypeCode?: string;
}

export interface AdvancePayment {
	paidAmount: number;
	receivedDate?: DateString;
	includedTax?: AdvancePaymentTax;
	invoiceReference?: AdvancePaymentInvoiceRef;
}

export interface AdvancePaymentTax {
	calculatedAmount: number;
	typeCode: string;
	categoryCode: string;
	ratePercent?: number;
}

export interface AdvancePaymentInvoiceRef {
	id: string;
	typeCode?: string;
	issueDate?: DateString;
}
