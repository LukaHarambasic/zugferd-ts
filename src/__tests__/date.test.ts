import { describe, expect, it } from "vitest";
import {
	formatDate,
	isValidDateString,
	isValidPeriod,
	parseDate,
} from "../utils/date";

describe("formatDate", () => {
	it("formats Date object to YYYYMMDD", () => {
		expect(formatDate(new Date(Date.UTC(2025, 4, 30)))).toBe("20250530");
	});

	it("formats ISO date string to YYYYMMDD", () => {
		expect(formatDate("2025-05-30")).toBe("20250530");
	});

	it("formats January 1st (single-digit month and day)", () => {
		expect(formatDate(new Date(Date.UTC(2025, 0, 1)))).toBe("20250101");
	});

	it("formats December 31st", () => {
		expect(formatDate(new Date(Date.UTC(2025, 11, 31)))).toBe("20251231");
	});

	it("formats spec example delivery date", () => {
		expect(formatDate("2025-05-13")).toBe("20250513");
	});
});

describe("parseDate", () => {
	it("parses YYYYMMDD to Date for May 30 2025", () => {
		const d = parseDate("20250530");
		expect(d.getUTCFullYear()).toBe(2025);
		expect(d.getUTCMonth()).toBe(4);
		expect(d.getUTCDate()).toBe(30);
	});

	it("parses YYYYMMDD to Date for January 1 2025", () => {
		const d = parseDate("20250101");
		expect(d.getUTCFullYear()).toBe(2025);
		expect(d.getUTCMonth()).toBe(0);
		expect(d.getUTCDate()).toBe(1);
	});

	it("round-trips through formatDate", () => {
		const original = "20251231";
		expect(formatDate(parseDate(original))).toBe(original);
	});
});

describe("isValidDateString", () => {
	it("accepts valid YYYYMMDD dates", () => {
		expect(isValidDateString("20250530")).toBe(true);
		expect(isValidDateString("20251231")).toBe(true);
		expect(isValidDateString("20250101")).toBe(true);
	});

	it("rejects date with wrong digit count", () => {
		expect(isValidDateString("2025053")).toBe(false);
	});

	it("rejects invalid month 13", () => {
		expect(isValidDateString("20251301")).toBe(false);
	});

	it("rejects invalid day 32", () => {
		expect(isValidDateString("20250532")).toBe(false);
	});

	it("rejects non-numeric string", () => {
		expect(isValidDateString("abcdefgh")).toBe(false);
	});

	it("rejects empty string", () => {
		expect(isValidDateString("")).toBe(false);
	});

	it("rejects ISO format with separators", () => {
		expect(isValidDateString("2025-05-30")).toBe(false);
	});

	it("accepts month 10 (October)", () => {
		expect(isValidDateString("20251001")).toBe(true);
	});

	it("accepts day 31", () => {
		expect(isValidDateString("20251031")).toBe(true);
	});
});

describe("isValidPeriod", () => {
	it("returns true for valid range from spec example (BR-CO-19)", () => {
		expect(isValidPeriod("20250513", "20250530")).toBe(true);
	});

	it("returns true for same-day period", () => {
		expect(isValidPeriod("20250530", "20250530")).toBe(true);
	});

	it("returns false when end is before start (BR-29)", () => {
		expect(isValidPeriod("20250531", "20250530")).toBe(false);
	});

	it("returns true across month boundary", () => {
		expect(isValidPeriod("20250131", "20250201")).toBe(true);
	});

	it("returns true across year boundary", () => {
		expect(isValidPeriod("20241231", "20250101")).toBe(true);
	});
});
