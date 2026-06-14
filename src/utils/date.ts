const CII_DATE_RE = /^\s*(\d{4})(1[0-2]|0[1-9])(3[01]|[12][0-9]|0[1-9])\s*$/;

export function formatDate(date: Date | string): string {
	if (typeof date === "string") {
		date = new Date(date);
	}
	const year = date.getUTCFullYear();
	const month = String(date.getUTCMonth() + 1).padStart(2, "0");
	const day = String(date.getUTCDate()).padStart(2, "0");
	return `${year}${month}${day}`;
}

export function parseDate(dateString: string): Date {
	const year = Number.parseInt(dateString.slice(0, 4), 10);
	const month = Number.parseInt(dateString.slice(4, 6), 10) - 1;
	const day = Number.parseInt(dateString.slice(6, 8), 10);
	return new Date(Date.UTC(year, month, day));
}

export function isValidDateString(value: string): boolean {
	return CII_DATE_RE.test(value);
}

export function isValidPeriod(start: string, end: string): boolean {
	return end >= start;
}
