import { describe, expect, it } from "vitest";
import {
	CREDIT_TRANSFER_CODES,
	DIRECT_DEBIT_CODES,
	DocumentTypeCode,
	EXEMPTION_REASON_REQUIRED,
	NoteSubjectCode,
	PaymentMeansCode,
	UnitCode,
	VALID_ALLOWANCE_REASON_CODES,
	VALID_CHARGE_REASON_CODES,
	VALID_COUNTRY_CODES,
	VALID_CURRENCY_CODES,
	VALID_DOCUMENT_TYPE_CODES,
	VALID_ELECTRONIC_ADDRESS_SCHEME_IDS,
	VALID_NOTE_SUBJECT_CODES,
	VALID_PARTY_SCHEME_IDS,
	VALID_PAYMENT_MEANS_CODES,
	VALID_TAX_SCHEME_IDS,
	VALID_UNIT_CODES,
	VALID_VAT_CATEGORY_CODES,
	VatCategoryCode,
	ZERO_TAX_CATEGORIES,
} from "../codes/index";

describe("DocumentTypeCode", () => {
	it("contains standard invoice code", () => {
		expect(VALID_DOCUMENT_TYPE_CODES.has("380")).toBe(true);
	});

	it("contains credit note code", () => {
		expect(VALID_DOCUMENT_TYPE_CODES.has("381")).toBe(true);
	});

	it("contains corrected invoice code", () => {
		expect(VALID_DOCUMENT_TYPE_CODES.has("384")).toBe(true);
	});

	it("contains Abschlagsrechnung (construction) code", () => {
		expect(VALID_DOCUMENT_TYPE_CODES.has("875")).toBe(true);
		expect(DocumentTypeCode.PARTIAL_INVOICE).toBe("875");
	});

	it("contains Schlussrechnung (construction) code", () => {
		expect(VALID_DOCUMENT_TYPE_CODES.has("877")).toBe(true);
		expect(DocumentTypeCode.FINAL_INVOICE).toBe("877");
	});

	it("rejects unknown codes", () => {
		expect(VALID_DOCUMENT_TYPE_CODES.has("999")).toBe(false);
		expect(VALID_DOCUMENT_TYPE_CODES.has("0")).toBe(false);
		expect(VALID_DOCUMENT_TYPE_CODES.has("")).toBe(false);
	});
});

describe("VatCategoryCode", () => {
	it("contains all nine category codes", () => {
		for (const code of ["S", "Z", "E", "AE", "K", "G", "O", "L", "M"]) {
			expect(VALID_VAT_CATEGORY_CODES.has(code)).toBe(true);
		}
	});

	it("rejects unknown codes", () => {
		expect(VALID_VAT_CATEGORY_CODES.has("X")).toBe(false);
		expect(VALID_VAT_CATEGORY_CODES.has("VAT")).toBe(false);
	});

	it("EXEMPTION_REASON_REQUIRED includes AE (reverse charge)", () => {
		expect(EXEMPTION_REASON_REQUIRED.has("AE")).toBe(true);
	});

	it("EXEMPTION_REASON_REQUIRED includes K (intra-community)", () => {
		expect(EXEMPTION_REASON_REQUIRED.has("K")).toBe(true);
	});

	it("EXEMPTION_REASON_REQUIRED includes E (exempt)", () => {
		expect(EXEMPTION_REASON_REQUIRED.has("E")).toBe(true);
	});

	it("EXEMPTION_REASON_REQUIRED does NOT include S (standard rate)", () => {
		expect(EXEMPTION_REASON_REQUIRED.has("S")).toBe(false);
	});

	it("ZERO_TAX_CATEGORIES includes Z, E, AE, K, G, O", () => {
		for (const code of ["Z", "E", "AE", "K", "G", "O"]) {
			expect(ZERO_TAX_CATEGORIES.has(code)).toBe(true);
		}
	});

	it("ZERO_TAX_CATEGORIES does NOT include S (standard rate)", () => {
		expect(ZERO_TAX_CATEGORIES.has("S")).toBe(false);
	});

	it("named object produces correct literals", () => {
		expect(VatCategoryCode.STANDARD_RATE).toBe("S");
		expect(VatCategoryCode.REVERSE_CHARGE).toBe("AE");
		expect(VatCategoryCode.INTRA_COMMUNITY).toBe("K");
		expect(VatCategoryCode.EXEMPT).toBe("E");
	});
});

describe("UnitCode", () => {
	it("contains piece (H87)", () => {
		expect(VALID_UNIT_CODES.has("H87")).toBe(true);
		expect(UnitCode.PIECE).toBe("H87");
	});

	it("contains square metre (MTK) used in construction billing", () => {
		expect(VALID_UNIT_CODES.has("MTK")).toBe(true);
		expect(UnitCode.SQUARE_METRE).toBe("MTK");
	});

	it("contains flat rate (LS / Pauschal)", () => {
		expect(VALID_UNIT_CODES.has("LS")).toBe(true);
		expect(UnitCode.FLAT_RATE).toBe("LS");
	});

	it("contains hour (HUR)", () => {
		expect(VALID_UNIT_CODES.has("HUR")).toBe(true);
	});

	it("contains carton (XCT) from Warenrechnung example", () => {
		expect(VALID_UNIT_CODES.has("XCT")).toBe(true);
	});

	it("contains pallet (XPX) from Warenrechnung example", () => {
		expect(VALID_UNIT_CODES.has("XPX")).toBe(true);
	});

	it("rejects unknown unit codes", () => {
		expect(VALID_UNIT_CODES.has("XXX")).toBe(false);
		expect(VALID_UNIT_CODES.has("EA")).toBe(false);
	});
});

describe("PaymentMeansCode", () => {
	it("contains SEPA credit transfer (58)", () => {
		expect(VALID_PAYMENT_MEANS_CODES.has("58")).toBe(true);
		expect(PaymentMeansCode.SEPA_CREDIT_TRANSFER).toBe("58");
	});

	it("contains SEPA direct debit (59)", () => {
		expect(VALID_PAYMENT_MEANS_CODES.has("59")).toBe(true);
	});

	it("rejects unknown codes", () => {
		expect(VALID_PAYMENT_MEANS_CODES.has("00")).toBe(false);
		expect(VALID_PAYMENT_MEANS_CODES.has("99")).toBe(false);
	});

	it("CREDIT_TRANSFER_CODES contains 30 and 58", () => {
		expect(CREDIT_TRANSFER_CODES.has("30")).toBe(true);
		expect(CREDIT_TRANSFER_CODES.has("58")).toBe(true);
	});

	it("CREDIT_TRANSFER_CODES does NOT contain 59 (direct debit)", () => {
		expect(CREDIT_TRANSFER_CODES.has("59")).toBe(false);
	});

	it("DIRECT_DEBIT_CODES contains 49 and 59", () => {
		expect(DIRECT_DEBIT_CODES.has("49")).toBe(true);
		expect(DIRECT_DEBIT_CODES.has("59")).toBe(true);
	});

	it("DIRECT_DEBIT_CODES does NOT contain 58 (credit transfer)", () => {
		expect(DIRECT_DEBIT_CODES.has("58")).toBe(false);
	});
});

describe("AllowanceReasonCode and ChargeReasonCode", () => {
	it("VALID_ALLOWANCE_REASON_CODES contains standard discount code 95", () => {
		expect(VALID_ALLOWANCE_REASON_CODES.has("95")).toBe(true);
	});

	it("VALID_CHARGE_REASON_CODES contains freight charge code FC", () => {
		expect(VALID_CHARGE_REASON_CODES.has("FC")).toBe(true);
	});
});

describe("VALID_COUNTRY_CODES", () => {
	it("contains DE (Germany)", () => {
		expect(VALID_COUNTRY_CODES.has("DE")).toBe(true);
	});

	it("contains AT (Austria)", () => {
		expect(VALID_COUNTRY_CODES.has("AT")).toBe(true);
	});

	it("contains CH (Switzerland)", () => {
		expect(VALID_COUNTRY_CODES.has("CH")).toBe(true);
	});

	it("contains all EU member state codes", () => {
		const euCodes = [
			"AT",
			"BE",
			"BG",
			"CY",
			"CZ",
			"DE",
			"DK",
			"EE",
			"ES",
			"FI",
			"FR",
			"GR",
			"HR",
			"HU",
			"IE",
			"IT",
			"LT",
			"LU",
			"LV",
			"MT",
			"NL",
			"PL",
			"PT",
			"RO",
			"SE",
			"SI",
			"SK",
		];
		for (const code of euCodes) {
			expect(
				VALID_COUNTRY_CODES.has(code),
				`Expected EU code ${code} to be valid`,
			).toBe(true);
		}
	});

	it("contains EL (Greece alternative VAT prefix)", () => {
		expect(VALID_COUNTRY_CODES.has("EL")).toBe(true);
	});

	it("contains GB (UK post-Brexit)", () => {
		expect(VALID_COUNTRY_CODES.has("GB")).toBe(true);
	});

	it("contains US", () => {
		expect(VALID_COUNTRY_CODES.has("US")).toBe(true);
	});

	it("rejects XX (not an ISO 3166-1 code)", () => {
		expect(VALID_COUNTRY_CODES.has("XX")).toBe(false);
	});

	it("rejects DEU (alpha-3 form is not used in ZUGFeRD)", () => {
		expect(VALID_COUNTRY_CODES.has("DEU")).toBe(false);
	});

	it("rejects empty string", () => {
		expect(VALID_COUNTRY_CODES.has("")).toBe(false);
	});

	it("has at least 249 entries (full ISO 3166-1 + EL)", () => {
		expect(VALID_COUNTRY_CODES.size).toBeGreaterThanOrEqual(249);
	});
});

describe("VALID_CURRENCY_CODES", () => {
	it("contains EUR", () => {
		expect(VALID_CURRENCY_CODES.has("EUR")).toBe(true);
	});

	it("contains GBP (used in EXTENDED_Fremdwaehrung as accounting currency)", () => {
		expect(VALID_CURRENCY_CODES.has("GBP")).toBe(true);
	});

	it("contains CHF", () => {
		expect(VALID_CURRENCY_CODES.has("CHF")).toBe(true);
	});

	it("contains all EU non-euro currencies", () => {
		for (const code of ["CZK", "DKK", "HUF", "PLN", "RON", "SEK", "BGN"]) {
			expect(
				VALID_CURRENCY_CODES.has(code),
				`Expected EU currency ${code} to be valid`,
			).toBe(true);
		}
	});

	it("rejects XYZ (not a real ISO 4217 code)", () => {
		expect(VALID_CURRENCY_CODES.has("XYZ")).toBe(false);
	});

	it("rejects lowercase eur", () => {
		expect(VALID_CURRENCY_CODES.has("eur")).toBe(false);
	});

	it("has at least 140 entries", () => {
		expect(VALID_CURRENCY_CODES.size).toBeGreaterThanOrEqual(140);
	});
});

describe("Scheme IDs", () => {
	it("VALID_TAX_SCHEME_IDS contains VA (VAT) and FC (Steuernummer)", () => {
		expect(VALID_TAX_SCHEME_IDS.has("VA")).toBe(true);
		expect(VALID_TAX_SCHEME_IDS.has("FC")).toBe(true);
	});

	it("VALID_PARTY_SCHEME_IDS contains 0088 (GLN) and 0160 (GTIN)", () => {
		expect(VALID_PARTY_SCHEME_IDS.has("0088")).toBe(true);
		expect(VALID_PARTY_SCHEME_IDS.has("0160")).toBe(true);
	});

	it("VALID_ELECTRONIC_ADDRESS_SCHEME_IDS contains EM (email)", () => {
		expect(VALID_ELECTRONIC_ADDRESS_SCHEME_IDS.has("EM")).toBe(true);
	});
});

describe("NoteSubjectCode", () => {
	it("contains all codes appearing in EXTENDED examples", () => {
		expect(VALID_NOTE_SUBJECT_CODES.has("ACB")).toBe(true);
		expect(VALID_NOTE_SUBJECT_CODES.has("REG")).toBe(true);
		expect(VALID_NOTE_SUBJECT_CODES.has("AAI")).toBe(true);
		expect(VALID_NOTE_SUBJECT_CODES.has("AAK")).toBe(true);
		expect(VALID_NOTE_SUBJECT_CODES.has("AAJ")).toBe(true);
		expect(VALID_NOTE_SUBJECT_CODES.has("TXD")).toBe(true);
	});

	it("named object produces correct literals", () => {
		expect(NoteSubjectCode.GENERAL_INFORMATION).toBe("ACB");
		expect(NoteSubjectCode.REGISTRATION_INFO).toBe("REG");
		expect(NoteSubjectCode.TAX_INFO).toBe("TXD");
	});

	it("rejects unknown subject codes", () => {
		expect(VALID_NOTE_SUBJECT_CODES.has("ZZZ")).toBe(false);
	});
});
