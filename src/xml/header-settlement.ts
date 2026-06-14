import type { XMLBuilder } from "xmlbuilder2/lib/interfaces";
import type { TransactionCalculationResult } from "../calculation/transaction-calculator";
import type { ZugferdInvoice } from "../types/index";
import type { TaxBreakdown } from "../types/settlement";
import { formatAmount, formatPercent } from "../utils/index";
import { NS } from "./namespaces";
import { buildTradeParty } from "./trade-party";

function findInvoiceTaxEntry(
	invoice: ZugferdInvoice,
	categoryCode: string,
	ratePercent: number | undefined,
): TaxBreakdown | undefined {
	return (invoice.taxBreakdown ?? []).find(
		(t) => t.categoryCode === categoryCode && t.ratePercent === ratePercent,
	);
}

export function buildHeaderTradeSettlement(
	parent: XMLBuilder,
	invoice: ZugferdInvoice,
	calcResult: TransactionCalculationResult,
): void {
	const el = parent.ele(NS.RAM, "ram:ApplicableHeaderTradeSettlement");

	if (invoice.paymentMeans?.payerAccount?.creditorReference) {
		el.ele(NS.RAM, "ram:CreditorReferenceID")
			.txt(invoice.paymentMeans.payerAccount.creditorReference)
			.up();
	}

	if (invoice.paymentReference) {
		el.ele(NS.RAM, "ram:PaymentReference").txt(invoice.paymentReference).up();
	}

	if (invoice.taxCurrency) {
		el.ele(NS.RAM, "ram:TaxCurrencyCode").txt(invoice.taxCurrency).up();
	}

	el.ele(NS.RAM, "ram:InvoiceCurrencyCode").txt(invoice.currency).up();

	if (invoice.payee) {
		buildTradeParty(el, invoice.payee, "ram:PayeeTradeParty");
	}

	if (invoice.paymentMeans) {
		const pmEl = el.ele(NS.RAM, "ram:SpecifiedTradeSettlementPaymentMeans");
		pmEl.ele(NS.RAM, "ram:TypeCode").txt(invoice.paymentMeans.typeCode).up();

		if (invoice.paymentMeans.information) {
			pmEl
				.ele(NS.RAM, "ram:Information")
				.txt(invoice.paymentMeans.information)
				.up();
		}

		const account = invoice.paymentMeans.payeeAccount;
		if (account && (account.iban || account.proprietaryId)) {
			const acctEl = pmEl.ele(NS.RAM, "ram:PayeePartyCreditorFinancialAccount");
			if (account.iban) {
				acctEl.ele(NS.RAM, "ram:IBANID").txt(account.iban).up();
			} else if (account.proprietaryId) {
				acctEl.ele(NS.RAM, "ram:ProprietaryID").txt(account.proprietaryId).up();
			}
			if (account.accountName) {
				acctEl.ele(NS.RAM, "ram:AccountName").txt(account.accountName).up();
			}
			acctEl.up();
		}

		if (account?.bic) {
			const instEl = pmEl.ele(
				NS.RAM,
				"ram:PayeeSpecifiedCreditorFinancialInstitution",
			);
			instEl.ele(NS.RAM, "ram:BICID").txt(account.bic).up();
			instEl.up();
		}

		const debtorAccount = invoice.paymentMeans.payerAccount;
		if (debtorAccount?.iban) {
			const debtorEl = pmEl.ele(NS.RAM, "ram:PayerPartyDebtorFinancialAccount");
			debtorEl.ele(NS.RAM, "ram:IBANID").txt(debtorAccount.iban).up();
			debtorEl.up();
		}

		pmEl.up();
	}

	for (const breakdown of calcResult.vatBreakdowns) {
		const taxEl = el.ele(NS.RAM, "ram:ApplicableTradeTax");
		taxEl
			.ele(NS.RAM, "ram:CalculatedAmount")
			.txt(formatAmount(breakdown.calculatedAmount))
			.up();
		taxEl.ele(NS.RAM, "ram:TypeCode").txt("VAT").up();

		const invoiceTax = findInvoiceTaxEntry(
			invoice,
			breakdown.categoryCode,
			breakdown.ratePercent,
		);

		if (invoiceTax?.exemptionReason) {
			taxEl
				.ele(NS.RAM, "ram:ExemptionReason")
				.txt(invoiceTax.exemptionReason)
				.up();
		}

		taxEl
			.ele(NS.RAM, "ram:BasisAmount")
			.txt(formatAmount(breakdown.basisAmount))
			.up();
		taxEl.ele(NS.RAM, "ram:CategoryCode").txt(breakdown.categoryCode).up();

		if (invoiceTax?.dueDateTypeCode) {
			taxEl
				.ele(NS.RAM, "ram:DueDateTypeCode")
				.txt(invoiceTax.dueDateTypeCode)
				.up();
		}

		if (breakdown.categoryCode !== "O" && breakdown.ratePercent !== undefined) {
			taxEl
				.ele(NS.RAM, "ram:RateApplicablePercent")
				.txt(formatPercent(breakdown.ratePercent))
				.up();
		}

		taxEl.up();
	}

	const period = invoice.billingPeriod;
	if (period && (period.startDate || period.endDate)) {
		const periodEl = el.ele(NS.RAM, "ram:BillingSpecifiedPeriod");
		if (period.startDate) {
			const startEl = periodEl.ele(NS.RAM, "ram:StartDateTime");
			startEl
				.ele(NS.UDT, "udt:DateTimeString")
				.att(null, "format", "102")
				.txt(period.startDate)
				.up();
			startEl.up();
		}
		if (period.endDate) {
			const endEl = periodEl.ele(NS.RAM, "ram:EndDateTime");
			endEl
				.ele(NS.UDT, "udt:DateTimeString")
				.att(null, "format", "102")
				.txt(period.endDate)
				.up();
			endEl.up();
		}
		periodEl.up();
	}

	for (const allowance of invoice.allowances ?? []) {
		const acEl = el.ele(NS.RAM, "ram:SpecifiedTradeAllowanceCharge");
		const ciEl = acEl.ele(NS.RAM, "ram:ChargeIndicator");
		ciEl.ele(NS.UDT, "udt:Indicator").txt("false").up();
		ciEl.up();
		if (allowance.calculationPercent !== undefined) {
			acEl
				.ele(NS.RAM, "ram:CalculationPercent")
				.txt(formatPercent(allowance.calculationPercent))
				.up();
		}
		if (allowance.basisAmount !== undefined) {
			acEl
				.ele(NS.RAM, "ram:BasisAmount")
				.txt(formatAmount(allowance.basisAmount))
				.up();
		}
		acEl
			.ele(NS.RAM, "ram:ActualAmount")
			.txt(formatAmount(allowance.actualAmount))
			.up();
		if (allowance.reasonCode) {
			acEl.ele(NS.RAM, "ram:ReasonCode").txt(allowance.reasonCode).up();
		}
		if (allowance.reason) {
			acEl.ele(NS.RAM, "ram:Reason").txt(allowance.reason).up();
		}
		const catTaxEl = acEl.ele(NS.RAM, "ram:CategoryTradeTax");
		catTaxEl.ele(NS.RAM, "ram:TypeCode").txt("VAT").up();
		catTaxEl
			.ele(NS.RAM, "ram:CategoryCode")
			.txt(allowance.taxCategoryCode)
			.up();
		if (allowance.taxCategoryCode !== "O" && allowance.taxRate !== undefined) {
			catTaxEl
				.ele(NS.RAM, "ram:RateApplicablePercent")
				.txt(formatPercent(allowance.taxRate))
				.up();
		}
		catTaxEl.up();
		acEl.up();
	}

	for (const charge of invoice.charges ?? []) {
		const acEl = el.ele(NS.RAM, "ram:SpecifiedTradeAllowanceCharge");
		const ciEl = acEl.ele(NS.RAM, "ram:ChargeIndicator");
		ciEl.ele(NS.UDT, "udt:Indicator").txt("true").up();
		ciEl.up();
		if (charge.calculationPercent !== undefined) {
			acEl
				.ele(NS.RAM, "ram:CalculationPercent")
				.txt(formatPercent(charge.calculationPercent))
				.up();
		}
		if (charge.basisAmount !== undefined) {
			acEl
				.ele(NS.RAM, "ram:BasisAmount")
				.txt(formatAmount(charge.basisAmount))
				.up();
		}
		acEl
			.ele(NS.RAM, "ram:ActualAmount")
			.txt(formatAmount(charge.actualAmount))
			.up();
		if (charge.reasonCode) {
			acEl.ele(NS.RAM, "ram:ReasonCode").txt(charge.reasonCode).up();
		}
		if (charge.reason) {
			acEl.ele(NS.RAM, "ram:Reason").txt(charge.reason).up();
		}
		const catTaxEl = acEl.ele(NS.RAM, "ram:CategoryTradeTax");
		catTaxEl.ele(NS.RAM, "ram:TypeCode").txt("VAT").up();
		catTaxEl.ele(NS.RAM, "ram:CategoryCode").txt(charge.taxCategoryCode).up();
		if (charge.taxCategoryCode !== "O" && charge.taxRate !== undefined) {
			catTaxEl
				.ele(NS.RAM, "ram:RateApplicablePercent")
				.txt(formatPercent(charge.taxRate))
				.up();
		}
		catTaxEl.up();
		acEl.up();
	}

	for (const term of invoice.paymentTerms ?? []) {
		const termEl = el.ele(NS.RAM, "ram:SpecifiedTradePaymentTerms");
		if (term.description) {
			termEl.ele(NS.RAM, "ram:Description").txt(term.description).up();
		}
		if (term.dueDate) {
			const dueDtEl = termEl.ele(NS.RAM, "ram:DueDateDateTime");
			dueDtEl
				.ele(NS.UDT, "udt:DateTimeString")
				.att(null, "format", "102")
				.txt(term.dueDate)
				.up();
			dueDtEl.up();
		}
		if (term.directDebitMandateId) {
			termEl
				.ele(NS.RAM, "ram:DirectDebitMandateID")
				.txt(term.directDebitMandateId)
				.up();
		}
		if (term.cashDiscount) {
			const discEl = termEl.ele(
				NS.RAM,
				"ram:ApplicableTradePaymentDiscountTerms",
			);
			if (term.cashDiscount.basisAmount !== undefined) {
				discEl
					.ele(NS.RAM, "ram:BasisAmount")
					.txt(formatAmount(term.cashDiscount.basisAmount))
					.up();
			}
			discEl
				.ele(NS.RAM, "ram:CalculationPercent")
				.txt(formatPercent(term.cashDiscount.calculationPercent))
				.up();
			discEl.up();
		}
		termEl.up();
	}

	const totals = calcResult.totals;
	const summEl = el.ele(
		NS.RAM,
		"ram:SpecifiedTradeSettlementHeaderMonetarySummation",
	);
	summEl
		.ele(NS.RAM, "ram:LineTotalAmount")
		.txt(formatAmount(totals.lineTotalAmount))
		.up();
	summEl
		.ele(NS.RAM, "ram:ChargeTotalAmount")
		.txt(formatAmount(totals.chargeTotalAmount ?? 0))
		.up();
	summEl
		.ele(NS.RAM, "ram:AllowanceTotalAmount")
		.txt(formatAmount(totals.allowanceTotalAmount ?? 0))
		.up();
	summEl
		.ele(NS.RAM, "ram:TaxBasisTotalAmount")
		.txt(formatAmount(totals.taxBasisTotalAmount))
		.up();
	summEl
		.ele(NS.RAM, "ram:TaxTotalAmount")
		.att(null, "currencyID", invoice.currency)
		.txt(formatAmount(totals.taxTotalAmount ?? 0))
		.up();
	if (invoice.taxCurrency && totals.taxTotalAmountCurrency !== undefined) {
		summEl
			.ele(NS.RAM, "ram:TaxTotalAmount")
			.att(null, "currencyID", invoice.taxCurrency)
			.txt(formatAmount(totals.taxTotalAmountCurrency))
			.up();
	}
	summEl
		.ele(NS.RAM, "ram:GrandTotalAmount")
		.txt(formatAmount(totals.grandTotalAmount))
		.up();
	summEl
		.ele(NS.RAM, "ram:TotalPrepaidAmount")
		.txt(formatAmount(totals.totalPrepaidAmount ?? 0))
		.up();
	summEl
		.ele(NS.RAM, "ram:DuePayableAmount")
		.txt(formatAmount(totals.duePayableAmount))
		.up();
	summEl.up();

	if (invoice.precedingInvoices) {
		for (const preceding of invoice.precedingInvoices) {
			const refEl = el.ele(NS.RAM, "ram:InvoiceReferencedDocument");
			refEl.ele(NS.RAM, "ram:IssuerAssignedID").txt(preceding.reference).up();
			if (preceding.issueDate) {
				const dtEl = refEl.ele(NS.RAM, "ram:FormattedIssueDateTime");
				dtEl
					.ele(NS.QDT, "qdt:DateTimeString")
					.att(null, "format", "102")
					.txt(preceding.issueDate)
					.up();
				dtEl.up();
			}
			refEl.up();
		}
	}

	if (invoice.accountingReference) {
		const acctEl = el.ele(
			NS.RAM,
			"ram:ReceivableSpecifiedTradeAccountingAccount",
		);
		acctEl.ele(NS.RAM, "ram:ID").txt(invoice.accountingReference).up();
		acctEl.up();
	}

	for (const payment of invoice.advancePayments ?? []) {
		const advEl = el.ele(NS.RAM, "ram:SpecifiedAdvancePayment");
		advEl
			.ele(NS.RAM, "ram:PaidAmount")
			.txt(formatAmount(payment.paidAmount))
			.up();

		if (payment.receivedDate) {
			const rdEl = advEl.ele(NS.RAM, "ram:FormattedReceivedDateTime");
			rdEl
				.ele(NS.QDT, "qdt:DateTimeString")
				.att(null, "format", "102")
				.txt(payment.receivedDate)
				.up();
			rdEl.up();
		}

		if (payment.includedTax) {
			const taxEl = advEl.ele(NS.RAM, "ram:IncludedTradeTax");
			taxEl
				.ele(NS.RAM, "ram:CalculatedAmount")
				.txt(formatAmount(payment.includedTax.calculatedAmount))
				.up();
			taxEl.ele(NS.RAM, "ram:TypeCode").txt(payment.includedTax.typeCode).up();
			taxEl
				.ele(NS.RAM, "ram:CategoryCode")
				.txt(payment.includedTax.categoryCode)
				.up();
			if (payment.includedTax.ratePercent !== undefined) {
				taxEl
					.ele(NS.RAM, "ram:RateApplicablePercent")
					.txt(formatPercent(payment.includedTax.ratePercent))
					.up();
			}
			taxEl.up();
		}

		if (payment.invoiceReference) {
			const invRefEl = advEl.ele(
				NS.RAM,
				"ram:InvoiceSpecifiedReferencedDocument",
			);
			invRefEl
				.ele(NS.RAM, "ram:IssuerAssignedID")
				.txt(payment.invoiceReference.id)
				.up();
			if (payment.invoiceReference.typeCode) {
				invRefEl
					.ele(NS.RAM, "ram:TypeCode")
					.txt(payment.invoiceReference.typeCode)
					.up();
			}
			if (payment.invoiceReference.issueDate) {
				const idtEl = invRefEl.ele(NS.RAM, "ram:FormattedIssueDateTime");
				idtEl
					.ele(NS.QDT, "qdt:DateTimeString")
					.att(null, "format", "102")
					.txt(payment.invoiceReference.issueDate)
					.up();
				idtEl.up();
			}
			invRefEl.up();
		}

		advEl.up();
	}

	el.up();
}
