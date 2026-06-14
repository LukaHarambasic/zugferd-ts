export const DocumentTypeCode = {
	INVOICE: "380",
	CREDIT_NOTE: "381",
	DEBIT_NOTE: "383",
	CORRECTED_INVOICE: "384",
	PREPAYMENT_INVOICE: "386",
	SELF_BILLED: "389",
	PARTIAL_INVOICE: "875",
	FINAL_INVOICE: "877",
	ACCOUNTING_INFO: "751",
} as const;

export type DocumentTypeCode =
	(typeof DocumentTypeCode)[keyof typeof DocumentTypeCode];
export const VALID_DOCUMENT_TYPE_CODES: Set<string> = new Set(
	Object.values(DocumentTypeCode),
);
