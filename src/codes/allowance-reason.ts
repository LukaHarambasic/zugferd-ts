export const AllowanceReasonCode = {
	DISCOUNT: "95",
	SPECIAL_AGREEMENT: "100",
	BONUS_AGREEMENTS: "102",
	MANUFACTURER_BONUS: "103",
	PROMOTIONAL_DISCOUNT: "104",
	STOCK_GOODS: "64",
	DIRECT_DELIVERY: "70",
	EARLY_PAYMENT: "66",
	DAMAGE: "74",
	TOTAL_VOLUME_DISCOUNT: "62",
	LOYALTY_DISCOUNT: "60",
} as const;

export const ChargeReasonCode = {
	FREIGHT: "FC",
	INSURANCE: "FI",
	PACKING: "PC",
	HANDLING: "ABL",
	POSTAGE: "ADJ",
	SMALL_ORDER: "CG",
	SURCHARGE: "SAC",
} as const;

export type AllowanceReasonCode =
	(typeof AllowanceReasonCode)[keyof typeof AllowanceReasonCode];
export type ChargeReasonCode =
	(typeof ChargeReasonCode)[keyof typeof ChargeReasonCode];
export const VALID_ALLOWANCE_REASON_CODES: Set<string> = new Set(
	Object.values(AllowanceReasonCode),
);
export const VALID_CHARGE_REASON_CODES: Set<string> = new Set(
	Object.values(ChargeReasonCode),
);
