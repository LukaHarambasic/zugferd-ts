import { describe, expect, it } from "vitest";
import {
	formatAmount,
	formatPercent,
	formatPrice,
	formatQuantity,
	parseAmount,
	roundAmount,
	withinTolerance,
} from "../utils/decimal";

describe("roundAmount", () => {
	it("rounds 1.005 up to 1.01 (HALF_UP)", () => {
		expect(roundAmount(1.005, 2)).toBe(1.01);
	});

	it("rounds 1.004 down to 1.00", () => {
		expect(roundAmount(1.004, 2)).toBe(1.0);
	});

	it("rounds negative values away from zero at midpoint", () => {
		expect(roundAmount(-3.575, 2)).toBe(-3.58);
	});

	it("preserves exact negative values", () => {
		expect(roundAmount(-3.57, 2)).toBe(-3.57);
	});

	it("handles zero", () => {
		expect(roundAmount(0, 2)).toBe(0);
	});

	it("rounds 100.999 to 101.00", () => {
		expect(roundAmount(100.999, 2)).toBe(101.0);
	});

	it("rounds 64.245 to 64.25 (Java basisQuantity test)", () => {
		expect(roundAmount(64.245, 2)).toBe(64.25);
	});

	it("rounds to 4dp for price precision", () => {
		expect(roundAmount(1.00005, 4)).toBe(1.0001);
	});

	it("rounds to 0dp (integer)", () => {
		expect(roundAmount(2.5, 0)).toBe(3);
	});
});

describe("formatAmount", () => {
	it("formats 1234.5 as 1234.50", () => {
		expect(formatAmount(1234.5)).toBe("1234.50");
	});

	it("formats 0 as 0.00", () => {
		expect(formatAmount(0)).toBe("0.00");
	});

	it("formats negative amount", () => {
		expect(formatAmount(-3.57)).toBe("-3.57");
	});

	it("formats whole number with two decimal places", () => {
		expect(formatAmount(100)).toBe("100.00");
	});

	it("resolves 0.1 + 0.2 floating-point edge case to 0.30", () => {
		expect(formatAmount(0.1 + 0.2)).toBe("0.30");
	});

	it("formats large invoice amount", () => {
		expect(formatAmount(9847.25)).toBe("9847.25");
	});

	it("formats tax amount", () => {
		expect(formatAmount(1572.25)).toBe("1572.25");
	});
});

describe("formatPrice", () => {
	it("formats whole price to 4 decimal places", () => {
		expect(formatPrice(7)).toBe("7.0000");
	});

	it("formats short decimal to 4 places", () => {
		expect(formatPrice(0.052)).toBe("0.0520");
	});

	it("formats standard price to 4 places", () => {
		expect(formatPrice(128.49)).toBe("128.4900");
	});

	it("formats price with 4 significant decimal digits", () => {
		expect(formatPrice(6.1234)).toBe("6.1234");
	});
});

describe("formatQuantity", () => {
	it("formats whole integer quantity to 2 decimal places", () => {
		expect(formatQuantity(300)).toBe("300.00");
	});

	it("formats fractional quantity to 2 decimal places", () => {
		expect(formatQuantity(27.5)).toBe("27.50");
	});

	it("formats large quantity to 2 decimal places", () => {
		expect(formatQuantity(1000)).toBe("1000.00");
	});

	it("formats single unit", () => {
		expect(formatQuantity(1)).toBe("1.00");
	});

	it("formats negative quantity (credit note)", () => {
		expect(formatQuantity(-10)).toBe("-10.00");
	});
});

describe("formatPercent", () => {
	it("formats standard German VAT rate", () => {
		expect(formatPercent(19)).toBe("19.00");
	});

	it("formats reduced German VAT rate", () => {
		expect(formatPercent(7)).toBe("7.00");
	});

	it("formats zero rate (Kleinunternehmer / reverse charge)", () => {
		expect(formatPercent(0)).toBe("0.00");
	});

	it("formats fractional rate", () => {
		expect(formatPercent(2.5)).toBe("2.50");
	});
});

describe("withinTolerance", () => {
	it("returns true for exact match", () => {
		expect(withinTolerance(100.0, 100.0, 1)).toBe(true);
	});

	it("returns true at tolerance boundary for N=1", () => {
		expect(withinTolerance(100.01, 100.0, 1)).toBe(true);
	});

	it("returns false outside tolerance for N=1", () => {
		expect(withinTolerance(100.02, 100.0, 1)).toBe(false);
	});

	it("returns true at tolerance boundary for N=2", () => {
		expect(withinTolerance(100.02, 100.0, 2)).toBe(true);
	});

	it("returns true at tolerance boundary for N=5", () => {
		expect(withinTolerance(100.05, 100.0, 5)).toBe(true);
	});

	it("returns false just outside tolerance for N=5", () => {
		expect(withinTolerance(100.06, 100.0, 5)).toBe(false);
	});

	it("returns true for negative amounts (credit notes)", () => {
		expect(withinTolerance(-1190.01, -1190.0, 1)).toBe(true);
	});

	it("returns false when computed is below stated", () => {
		expect(withinTolerance(99.98, 100.0, 1)).toBe(false);
	});
});

describe("parseAmount", () => {
	it("parses standard amount string", () => {
		expect(parseAmount("1234.56")).toBe(1234.56);
	});

	it("parses zero string", () => {
		expect(parseAmount("0.00")).toBe(0);
	});

	it("parses negative amount string", () => {
		expect(parseAmount("-3.57")).toBe(-3.57);
	});

	it("parses integer-like string", () => {
		expect(parseAmount("100.00")).toBe(100);
	});
});
