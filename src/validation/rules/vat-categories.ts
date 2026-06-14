import type { ZugferdInvoice } from "../../types";
import type { ValidationError } from "../errors";

function makeError(
	ruleId: string,
	path: string,
	message: string,
): ValidationError {
	return { ruleId, path, message, severity: "error" };
}

function categoryUsed(invoice: ZugferdInvoice, code: string): boolean {
	const inLines = invoice.lines.some((l) => l.taxCategoryCode === code);
	const inAllowances = (invoice.allowances ?? []).some(
		(a) => a.taxCategoryCode === code,
	);
	const inCharges = (invoice.charges ?? []).some(
		(c) => c.taxCategoryCode === code,
	);
	return inLines || inAllowances || inCharges;
}

function sellerHasVatId(invoice: ZugferdInvoice): boolean {
	return (invoice.seller.taxRegistrations ?? []).some(
		(r) => r.schemeId === "VA",
	);
}

function buyerHasVatId(invoice: ZugferdInvoice): boolean {
	return (invoice.buyer.taxRegistrations ?? []).some(
		(r) => r.schemeId === "VA",
	);
}

function taxBreakdownsForCategory(invoice: ZugferdInvoice, code: string) {
	return (invoice.taxBreakdown ?? []).filter((b) => b.categoryCode === code);
}

function expectedBasis(
	invoice: ZugferdInvoice,
	categoryCode: string,
	taxRate: number,
): number {
	const lineSum = invoice.lines
		.filter((l) => l.taxCategoryCode === categoryCode && l.taxRate === taxRate)
		.reduce((acc, l) => acc + (l.lineTotalAmount ?? 0), 0);

	const chargeSum = (invoice.charges ?? [])
		.filter((c) => c.taxCategoryCode === categoryCode && c.taxRate === taxRate)
		.reduce((acc, c) => acc + (c.actualAmount ?? 0), 0);

	const allowanceSum = (invoice.allowances ?? [])
		.filter((a) => a.taxCategoryCode === categoryCode && a.taxRate === taxRate)
		.reduce((acc, a) => acc + (a.actualAmount ?? 0), 0);

	return lineSum + chargeSum - allowanceSum;
}

export function validateBrS(invoice: ZugferdInvoice): ValidationError[] {
	if (!categoryUsed(invoice, "S")) return [];

	const errors: ValidationError[] = [];
	const breakdowns = taxBreakdownsForCategory(invoice, "S");

	if (breakdowns.length < 1) {
		errors.push(
			makeError(
				"BR-S-01",
				"taxBreakdown",
				"BR-S-01: At least one VAT breakdown with category S must be present.",
			),
		);
	}

	const hasSellerVat =
		sellerHasVatId(invoice) || invoice.sellerTaxRepresentative?.vatId != null;

	if (!hasSellerVat) {
		errors.push(
			makeError(
				"BR-S-02",
				"seller.taxRegistrations",
				"BR-S-02: Seller VAT identifier (BT-31) or tax representative VAT identifier (BT-63) must be present for category S.",
			),
		);
	}

	for (let i = 0; i < breakdowns.length; i++) {
		const b = breakdowns[i];
		if ((b.ratePercent ?? 0) <= 0) {
			errors.push(
				makeError(
					"BR-S-05",
					`taxBreakdown[${i}]`,
					"BR-S-05: VAT category rate (BT-119) must be greater than zero for category S.",
				),
			);
		}
		if (
			Math.abs(
				b.basisAmount - expectedBasis(invoice, "S", b.ratePercent ?? 0),
			) >= 0.02
		) {
			errors.push(
				makeError(
					"BR-S-06",
					`taxBreakdown[${i}]`,
					"BR-S-06: VAT category taxable amount (BT-116) does not match sum of line/allowance/charge amounts for category S.",
				),
			);
		}
	}

	for (let i = 0; i < invoice.lines.length; i++) {
		const line = invoice.lines[i];
		if (line.taxCategoryCode === "S" && (line.taxRate ?? 0) <= 0) {
			errors.push(
				makeError(
					"BR-S-08",
					`lines[${i}].taxCategoryCode`,
					"BR-S-08: VAT rate must be greater than zero for line items with category S.",
				),
			);
		}
	}

	for (const [i, a] of (invoice.allowances ?? []).entries()) {
		if (a.taxCategoryCode === "S" && (a.taxRate ?? 0) <= 0) {
			errors.push(
				makeError(
					"BR-S-09",
					`allowances[${i}].taxCategoryCode`,
					"BR-S-09: VAT rate must be greater than zero for allowances with category S.",
				),
			);
		}
	}

	for (const [i, c] of (invoice.charges ?? []).entries()) {
		if (c.taxCategoryCode === "S" && (c.taxRate ?? 0) <= 0) {
			errors.push(
				makeError(
					"BR-S-10",
					`charges[${i}].taxCategoryCode`,
					"BR-S-10: VAT rate must be greater than zero for charges with category S.",
				),
			);
		}
	}

	return errors;
}

export function validateBrAe(invoice: ZugferdInvoice): ValidationError[] {
	if (!categoryUsed(invoice, "AE")) return [];

	const errors: ValidationError[] = [];
	const breakdowns = taxBreakdownsForCategory(invoice, "AE");

	if (breakdowns.length !== 1) {
		errors.push(
			makeError(
				"BR-AE-01",
				"taxBreakdown",
				"BR-AE-01: Exactly one VAT breakdown with category AE must be present.",
			),
		);
	}

	if (!sellerHasVatId(invoice)) {
		errors.push(
			makeError(
				"BR-AE-02",
				"seller.taxRegistrations",
				"BR-AE-02: Seller VAT identifier (BT-31) is mandatory for reverse charge (§13b UStG).",
			),
		);
	}

	if (!buyerHasVatId(invoice)) {
		errors.push(
			makeError(
				"BR-AE-03",
				"buyer.taxRegistrations",
				"Buyer VAT identifier (BT-48) is mandatory for reverse charge (§13b UStG).",
			),
		);
	}

	for (let i = 0; i < breakdowns.length; i++) {
		const b = breakdowns[i];
		if (b.calculatedAmount !== 0) {
			errors.push(
				makeError(
					"BR-AE-05",
					`taxBreakdown[${i}]`,
					"BR-AE-05: VAT category tax amount (BT-117) must be zero for category AE.",
				),
			);
		}
		if (Math.abs(b.basisAmount - expectedBasis(invoice, "AE", 0)) >= 0.02) {
			errors.push(
				makeError(
					"BR-AE-06",
					`taxBreakdown[${i}]`,
					"BR-AE-06: VAT category taxable amount (BT-116) does not match sum of line/allowance/charge amounts for category AE.",
				),
			);
		}
		if (b.exemptionReason == null && b.exemptionReasonCode == null) {
			errors.push(
				makeError(
					"BR-AE-07",
					`taxBreakdown[${i}]`,
					"Exemption reason (BT-120 or BT-121) is mandatory for reverse charge.",
				),
			);
		}
	}

	for (let i = 0; i < invoice.lines.length; i++) {
		const line = invoice.lines[i];
		if (line.taxCategoryCode === "AE" && line.taxRate !== 0) {
			errors.push(
				makeError(
					"BR-AE-08",
					`lines[${i}].taxCategoryCode`,
					"BR-AE-08: VAT rate must be zero for line items with category AE.",
				),
			);
		}
	}

	for (const [i, a] of (invoice.allowances ?? []).entries()) {
		if (a.taxCategoryCode === "AE" && a.taxRate !== 0) {
			errors.push(
				makeError(
					"BR-AE-09",
					`allowances[${i}].taxCategoryCode`,
					"BR-AE-09: VAT rate must be zero for allowances with category AE.",
				),
			);
		}
	}

	for (const [i, c] of (invoice.charges ?? []).entries()) {
		if (c.taxCategoryCode === "AE" && c.taxRate !== 0) {
			errors.push(
				makeError(
					"BR-AE-10",
					`charges[${i}].taxCategoryCode`,
					"BR-AE-10: VAT rate must be zero for charges with category AE.",
				),
			);
		}
	}

	return errors;
}

export function validateBrE(invoice: ZugferdInvoice): ValidationError[] {
	if (!categoryUsed(invoice, "E")) return [];

	const errors: ValidationError[] = [];
	const breakdowns = taxBreakdownsForCategory(invoice, "E");

	if (breakdowns.length !== 1) {
		errors.push(
			makeError(
				"BR-E-01",
				"taxBreakdown",
				"BR-E-01: Exactly one VAT breakdown with category E must be present.",
			),
		);
	}

	const hasSellerId =
		sellerHasVatId(invoice) ||
		(invoice.seller.taxRegistrations ?? []).some((r) => r.schemeId === "FC");

	if (!hasSellerId) {
		errors.push(
			makeError(
				"BR-E-02",
				"seller.taxRegistrations",
				"BR-E-02: Seller VAT identifier (BT-31) or tax number (FC) must be present for category E.",
			),
		);
	}

	for (let i = 0; i < breakdowns.length; i++) {
		const b = breakdowns[i];
		if (b.exemptionReason == null && b.exemptionReasonCode == null) {
			errors.push(
				makeError(
					"BR-E-05",
					`taxBreakdown[${i}]`,
					"Exemption reason (BT-120 or BT-121) is mandatory for VAT category E (e.g., § 19 UStG).",
				),
			);
		}
		if (b.calculatedAmount !== 0) {
			errors.push(
				makeError(
					"BR-E-06",
					`taxBreakdown[${i}]`,
					"BR-E-06: VAT category tax amount (BT-117) must be zero for category E.",
				),
			);
		}
	}

	for (let i = 0; i < invoice.lines.length; i++) {
		const line = invoice.lines[i];
		if (line.taxCategoryCode === "E" && line.taxRate !== 0) {
			errors.push(
				makeError(
					"BR-E-08",
					`lines[${i}].taxCategoryCode`,
					"BR-E-08: VAT rate must be zero for line items with category E.",
				),
			);
		}
	}

	return errors;
}

export function validateBrIc(invoice: ZugferdInvoice): ValidationError[] {
	if (!categoryUsed(invoice, "K")) return [];

	const errors: ValidationError[] = [];
	const breakdowns = taxBreakdownsForCategory(invoice, "K");

	if (breakdowns.length !== 1) {
		errors.push(
			makeError(
				"BR-IC-01",
				"taxBreakdown",
				"BR-IC-01: Exactly one VAT breakdown with category K must be present.",
			),
		);
	}

	if (!sellerHasVatId(invoice)) {
		errors.push(
			makeError(
				"BR-IC-02",
				"seller.taxRegistrations",
				"BR-IC-02: Seller VAT identifier (BT-31) is mandatory for intra-community supply.",
			),
		);
	}

	if (!buyerHasVatId(invoice)) {
		errors.push(
			makeError(
				"BR-IC-03",
				"buyer.taxRegistrations",
				"BR-IC-03: Buyer VAT identifier (BT-48) is mandatory for intra-community supply.",
			),
		);
	}

	for (let i = 0; i < breakdowns.length; i++) {
		const b = breakdowns[i];
		if (b.calculatedAmount !== 0) {
			errors.push(
				makeError(
					"BR-IC-05",
					`taxBreakdown[${i}]`,
					"BR-IC-05: VAT category tax amount (BT-117) must be zero for category K.",
				),
			);
		}
		if (b.exemptionReason == null && b.exemptionReasonCode == null) {
			errors.push(
				makeError(
					"BR-IC-07",
					`taxBreakdown[${i}]`,
					"BR-IC-07: Exemption reason (BT-120 or BT-121) is mandatory for intra-community supply.",
				),
			);
		}
	}

	if (invoice.deliveryDate == null && invoice.billingPeriod == null) {
		errors.push(
			makeError(
				"BR-IC-11",
				"invoice.deliveryDate",
				"BR-IC-11: Delivery date (BT-72) or billing period (BG-14) must be present for intra-community supply.",
			),
		);
	}

	if (invoice.shipTo?.address?.countryCode == null) {
		errors.push(
			makeError(
				"BR-IC-12",
				"invoice.shipToAddress.countryCode",
				"BR-IC-12: Ship-to country code (BT-80) must be present for intra-community supply.",
			),
		);
	}

	return errors;
}

export function validateBrG(invoice: ZugferdInvoice): ValidationError[] {
	if (!categoryUsed(invoice, "G")) return [];

	const errors: ValidationError[] = [];
	const breakdowns = taxBreakdownsForCategory(invoice, "G");

	if (breakdowns.length !== 1) {
		errors.push(
			makeError(
				"BR-G-01",
				"taxBreakdown",
				"BR-G-01: Exactly one VAT breakdown with category G must be present.",
			),
		);
	}

	if (!sellerHasVatId(invoice)) {
		errors.push(
			makeError(
				"BR-G-02",
				"seller.taxRegistrations",
				"BR-G-02: Seller VAT identifier (BT-31) is mandatory for export supply.",
			),
		);
	}

	for (let i = 0; i < breakdowns.length; i++) {
		const b = breakdowns[i];
		if (b.calculatedAmount !== 0) {
			errors.push(
				makeError(
					"BR-G-05",
					`taxBreakdown[${i}]`,
					"BR-G-05: VAT category tax amount (BT-117) must be zero for category G.",
				),
			);
		}
		if (b.exemptionReason == null && b.exemptionReasonCode == null) {
			errors.push(
				makeError(
					"BR-G-07",
					`taxBreakdown[${i}]`,
					"BR-G-07: Exemption reason (BT-120 or BT-121) is mandatory for export supply.",
				),
			);
		}
	}

	return errors;
}

export function validateBrO(invoice: ZugferdInvoice): ValidationError[] {
	if (!categoryUsed(invoice, "O")) return [];

	const errors: ValidationError[] = [];
	const breakdowns = taxBreakdownsForCategory(invoice, "O");

	if (breakdowns.length !== 1) {
		errors.push(
			makeError(
				"BR-O-01",
				"taxBreakdown",
				"BR-O-01: Exactly one VAT breakdown with category O must be present.",
			),
		);
	}

	const allBreakdowns = invoice.taxBreakdown ?? [];
	const onlyO = allBreakdowns.every((b) => b.categoryCode === "O");
	if (onlyO && sellerHasVatId(invoice)) {
		errors.push(
			makeError(
				"BR-O-02",
				"seller.taxRegistrations",
				"BR-O-02: Seller must not have a VAT identifier (BT-31) when only category O is used.",
			),
		);
	}

	for (let i = 0; i < breakdowns.length; i++) {
		const b = breakdowns[i];
		if (b.calculatedAmount !== 0) {
			errors.push(
				makeError(
					"BR-O-05",
					`taxBreakdown[${i}]`,
					"BR-O-05: VAT category tax amount (BT-117) must be zero for category O.",
				),
			);
		}
	}

	for (let i = 0; i < invoice.lines.length; i++) {
		const line = invoice.lines[i];
		if (line.taxCategoryCode === "O" && line.taxRate != null) {
			errors.push(
				makeError(
					"BR-O-08",
					`lines[${i}].taxCategoryCode`,
					"BR-O-08: VAT rate must be absent for line items with category O.",
				),
			);
		}
	}

	for (const [i, a] of (invoice.allowances ?? []).entries()) {
		if (a.taxCategoryCode !== "O") {
			errors.push(
				makeError(
					"BR-O-11",
					`allowances[${i}].taxCategoryCode`,
					"BR-O-11: All document allowances must use category O when O is present.",
				),
			);
		}
	}

	for (const [i, c] of (invoice.charges ?? []).entries()) {
		if (c.taxCategoryCode !== "O") {
			errors.push(
				makeError(
					"BR-O-12",
					`charges[${i}].taxCategoryCode`,
					"BR-O-12: All document charges must use category O when O is present.",
				),
			);
		}
	}

	return errors;
}

export function validateBrZ(invoice: ZugferdInvoice): ValidationError[] {
	if (!categoryUsed(invoice, "Z")) return [];

	const errors: ValidationError[] = [];
	const breakdowns = taxBreakdownsForCategory(invoice, "Z");

	if (breakdowns.length !== 1) {
		errors.push(
			makeError(
				"BR-Z-01",
				"taxBreakdown",
				"BR-Z-01: Exactly one VAT breakdown with category Z must be present.",
			),
		);
	}

	for (let i = 0; i < breakdowns.length; i++) {
		const b = breakdowns[i];
		if (b.calculatedAmount !== 0) {
			errors.push(
				makeError(
					"BR-Z-05",
					`taxBreakdown[${i}]`,
					"BR-Z-05: VAT category tax amount (BT-117) must be zero for category Z.",
				),
			);
		}
		if (Math.abs(b.basisAmount - expectedBasis(invoice, "Z", 0)) >= 0.02) {
			errors.push(
				makeError(
					"BR-Z-06",
					`taxBreakdown[${i}]`,
					"BR-Z-06: VAT category taxable amount (BT-116) does not match sum of line/allowance/charge amounts for category Z.",
				),
			);
		}
	}

	for (let i = 0; i < invoice.lines.length; i++) {
		const line = invoice.lines[i];
		if (line.taxCategoryCode === "Z" && line.taxRate !== 0) {
			errors.push(
				makeError(
					"BR-Z-08",
					`lines[${i}].taxCategoryCode`,
					"BR-Z-08: VAT rate must be zero for line items with category Z.",
				),
			);
		}
	}

	return errors;
}

export function validateBrFxEn04(invoice: ZugferdInvoice): ValidationError[] {
	if (
		invoice.seller.address?.countryCode !== "DE" ||
		invoice.buyer.address?.countryCode !== "DE" ||
		invoice.typeCode === "386"
	) {
		return [];
	}

	const hasDeliveryDate = invoice.deliveryDate != null;
	const hasBillingPeriod = invoice.billingPeriod != null;
	const hasLineBillingPeriod = invoice.lines.some(
		(l) => l.billingPeriod != null,
	);

	if (!hasDeliveryDate && !hasBillingPeriod && !hasLineBillingPeriod) {
		return [
			makeError(
				"BR-FX-EN-04",
				"invoice.deliveryDate",
				"German domestic invoices must specify a delivery date (BT-72), billing period (BG-14), or at least one line billing period (BG-26)",
			),
		];
	}

	return [];
}
