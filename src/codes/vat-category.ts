export const VatCategoryCode = {
	STANDARD_RATE: "S",
	ZERO_RATE: "Z",
	EXEMPT: "E",
	REVERSE_CHARGE: "AE",
	INTRA_COMMUNITY: "K",
	EXPORT: "G",
	NOT_SUBJECT: "O",
	IGIC: "L",
	IPSI: "M",
} as const;

export type VatCategoryCode =
	(typeof VatCategoryCode)[keyof typeof VatCategoryCode];
export const VALID_VAT_CATEGORY_CODES: Set<string> = new Set(
	Object.values(VatCategoryCode),
);

export const EXEMPTION_REASON_REQUIRED: ReadonlySet<string> = new Set([
	"AE",
	"E",
	"K",
	"G",
	"O",
]);

export const ZERO_TAX_CATEGORIES: ReadonlySet<string> = new Set([
	"Z",
	"E",
	"AE",
	"K",
	"G",
	"O",
	"L",
	"M",
]);
