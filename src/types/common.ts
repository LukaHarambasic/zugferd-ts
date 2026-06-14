export type DateString = string;
export type CurrencyCode = string;
export type CountryCode = string;
export type LanguageCode = string;

export interface BillingPeriod {
	startDate: DateString;
	endDate: DateString;
}

export interface AttachedDocument {
	id: string;
	description?: string;
	uri?: string;
	content?: Uint8Array;
	mimeCode?: string;
	filename?: string;
}

export interface Note {
	content: string;
	subjectCode?: string;
	contentCode?: string;
}

export interface SchemedId {
	id: string;
	schemeId?: string;
}
