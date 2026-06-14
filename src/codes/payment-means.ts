export const PaymentMeansCode = {
	CASH: "10",
	CHEQUE: "20",
	CREDIT_TRANSFER: "30",
	PAYMENT_TO_BANK_ACCOUNT: "42",
	BANK_CARD: "48",
	DIRECT_DEBIT: "49",
	STANDING_AGREEMENT: "57",
	SEPA_CREDIT_TRANSFER: "58",
	SEPA_DIRECT_DEBIT: "59",
	CLEARED: "97",
} as const;

export type PaymentMeansCode =
	(typeof PaymentMeansCode)[keyof typeof PaymentMeansCode];
export const VALID_PAYMENT_MEANS_CODES: Set<string> = new Set(
	Object.values(PaymentMeansCode),
);

export const CREDIT_TRANSFER_CODES: ReadonlySet<string> = new Set(["30", "58"]);
export const DIRECT_DEBIT_CODES: ReadonlySet<string> = new Set(["49", "59"]);
