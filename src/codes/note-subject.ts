export const NoteSubjectCode = {
	GENERAL_INFORMATION: "ACB",
	REGISTRATION_INFO: "REG",
	DISCOUNT_AGREEMENTS: "AAI",
	BONUS_AGREEMENTS: "AAK",
	RETENTION_OF_TITLE: "AAJ",
	TAX_INFO: "TXD",
	CUSTOMS_INFO: "CUS",
	PAYMENT_INFO: "PMT",
} as const;

export type NoteSubjectCode =
	(typeof NoteSubjectCode)[keyof typeof NoteSubjectCode];
export const VALID_NOTE_SUBJECT_CODES: Set<string> = new Set(
	Object.values(NoteSubjectCode),
);
