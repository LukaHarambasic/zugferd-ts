export const TaxSchemeId = {
	VAT: "VA",
	FISCAL: "FC",
} as const;

export const PartySchemeId = {
	GLN: "0088",
	DUNS: "0060",
	SIRET: "0002",
	GTIN: "0160",
	LEI: "0199",
	SWIFT: "0177",
} as const;

export const LegalOrgSchemeId = {
	HRA: "HRA",
	HRB: "HRB",
	GEN_REG: "0002",
} as const;

export const ElectronicAddressSchemeId = {
	EMAIL: "EM",
	GLN: "0088",
} as const;

export type TaxSchemeId = (typeof TaxSchemeId)[keyof typeof TaxSchemeId];
export type PartySchemeId = (typeof PartySchemeId)[keyof typeof PartySchemeId];

export const VALID_TAX_SCHEME_IDS: Set<string> = new Set(
	Object.values(TaxSchemeId),
);
export const VALID_PARTY_SCHEME_IDS: Set<string> = new Set(
	Object.values(PartySchemeId),
);
export const VALID_ELECTRONIC_ADDRESS_SCHEME_IDS: Set<string> = new Set(
	Object.values(ElectronicAddressSchemeId),
);
