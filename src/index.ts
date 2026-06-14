import { generateCiiXml } from "./generator";
import { embedZugferdXml } from "./pdf/embed";
import type { ZugferdInvoice } from "./types";
import type { ValidationError, ValidationResult } from "./validation/errors";
import { codeRules } from "./validation/rules/codes";
import { crossCheckRules } from "./validation/rules/cross-check";
import { validateDecimal } from "./validation/rules/decimal";
import { validateExtended } from "./validation/rules/extended";
import { formatRules } from "./validation/rules/formats";
import {
	validateBrAe,
	validateBrE,
	validateBrFxEn04,
	validateBrG,
	validateBrIc,
	validateBrO,
	validateBrS,
	validateBrZ,
} from "./validation/rules/vat-categories";
import { getAllRules, validate } from "./validation/runner";

export class ZugferdError extends Error {
	readonly cause: unknown;

	constructor(message: string, cause: unknown) {
		super(message);
		this.name = "ZugferdError";
		this.cause = cause;
	}
}

export interface ZugferdResult {
	xml: string;
	pdfBuffer: Uint8Array;
	validationErrors: ValidationError[];
}

export function validateInvoice(invoice: ZugferdInvoice): ValidationResult {
	const rules = [
		...getAllRules(),
		...codeRules,
		...formatRules,
		...crossCheckRules,
		validateBrS,
		validateBrAe,
		validateBrE,
		validateBrIc,
		validateBrG,
		validateBrO,
		validateBrZ,
		validateBrFxEn04,
		validateExtended,
		validateDecimal,
	];
	return validate(invoice, rules);
}

export function generateXml(invoice: ZugferdInvoice): string {
	const result = validateInvoice(invoice);
	if (!result.valid) {
		const summary = result.errors
			.slice(0, 5)
			.map((e) => e.message)
			.join("\n");
		const more =
			result.errors.length > 5
				? `\n... and ${result.errors.length - 5} more errors`
				: "";
		throw new ZugferdError(
			`Invoice validation failed with ${result.errors.length} error(s):\n${summary}${more}`,
			result.errors,
		);
	}
	return generateCiiXml(invoice).xml;
}

export async function generateZugferd(
	invoice: ZugferdInvoice,
	pdfBuffer: Uint8Array,
): Promise<ZugferdResult> {
	const result = validateInvoice(invoice);

	if (!result.valid) {
		return {
			xml: "",
			pdfBuffer: new Uint8Array(),
			validationErrors: result.errors,
		};
	}

	let xml: string;
	try {
		xml = generateCiiXml(invoice).xml;
	} catch (cause) {
		throw new ZugferdError(
			"XML generation failed after successful validation",
			cause,
		);
	}

	const embeddedPdf = await embedZugferdXml(pdfBuffer, xml);

	return {
		xml,
		pdfBuffer: embeddedPdf,
		validationErrors: [],
	};
}

export type {
	AttachedDocument,
	BillingPeriod,
	CountryCode,
	CurrencyCode,
	DateString,
	LanguageCode,
	Note,
	SchemedId,
} from "./types/common";
export type {
	Contact,
	LegalOrganization,
	PostalAddress,
	PrecedingInvoice,
	TaxRegistration,
	TaxRepresentative,
	TradeParty,
	ZugferdInvoice,
} from "./types/invoice";
export type {
	GrossPrice,
	InvoiceLine,
	ItemAttribute,
	LineAllowance,
	LineCharge,
	Product,
	ProductAllowance,
	ProductCharge,
	ProductClassification,
} from "./types/product";
export type {
	AdvancePayment,
	AdvancePaymentInvoiceRef,
	AdvancePaymentTax,
	BankAccount,
	CashDiscount,
	DebitAccount,
	DocumentAllowance,
	DocumentCharge,
	MonetarySummation,
	PaymentMeans,
	PaymentTerms,
	TaxBreakdown,
} from "./types/settlement";
export { roundAmount } from "./utils/decimal";
export type {
	ValidationError,
	ValidationResult,
	ValidationSeverity,
} from "./validation/errors";
export type { ValidationRule } from "./validation/runner";
