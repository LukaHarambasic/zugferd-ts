# zugferd-ts

[![npm version](https://img.shields.io/npm/v/zugferd-ts.svg)](https://www.npmjs.com/package/zugferd-ts)
[![CI](https://github.com/LukaHarambasic/zugferd-ts/actions/workflows/ci.yml/badge.svg)](https://github.com/LukaHarambasic/zugferd-ts/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

TypeScript generator for **ZUGFeRD / Factur-X** electronic invoices (the German/French
[EN 16931](https://en.wikipedia.org/wiki/EN_16931) standard). It builds the **CII XML**
(Cross-Industry Invoice, UN/CEFACT), validates it against the EN 16931 business rules, and
**embeds it into a PDF/A-3** so a single file is both human- and machine-readable.

- 🧾 **CII XML generation** at the EXTENDED profile.
- ✅ **EN 16931 validation** — mandatory fields, code lists, formats, VAT-category rules
  (BR-S / BR-AE / BR-E / BR-IC / BR-G / BR-O / BR-Z), cross-checks and arithmetic.
- 📎 **PDF/A-3 embedding** — attaches the XML + XMP metadata to an existing PDF via
  [`pdf-lib`](https://github.com/Hopding/pdf-lib).
- 🌍 **Runs anywhere** — pure TypeScript, **no Node-specific APIs**. Works in Node ≥18,
  Bun, Deno, browsers and edge runtimes.
- 🟦 **Types first** — every input is fully typed; ships ESM **and** CJS with `.d.ts`.

> **Built with Bun, Node-compatible.** This package is developed and built with
> [Bun](https://bun.sh) (`bun@1.3.12`), but the published output is standard dual ESM + CJS
> and depends on nothing Bun-specific — it runs on any modern JavaScript runtime.

## Install

```bash
bun add zugferd-ts
# or
npm install zugferd-ts
```

`pdf-lib` and `xmlbuilder2` are pulled in as dependencies.

## Quick start

Build a `ZugferdInvoice`, then hand it an existing invoice PDF (any `Uint8Array`) to get a
ZUGFeRD-embedded PDF/A-3 back. Validation runs automatically.

```ts
import { readFile, writeFile } from "node:fs/promises";
import { generateZugferd, type ZugferdInvoice } from "zugferd-ts";

const invoice: ZugferdInvoice = {
	invoiceNumber: "2024-0001",
	typeCode: "380", // 380 = commercial invoice, 381 = credit note
	issueDate: "20240601", // YYYYMMDD
	currency: "EUR",
	seller: {
		name: "Muster Bau GmbH",
		address: { lineOne: "Hauptstr. 1", city: "Berlin", postalCode: "10115", countryCode: "DE" },
		taxRegistrations: [{ id: "DE123456789", schemeId: "VA" }],
	},
	buyer: {
		name: "Kunde AG",
		address: { lineOne: "Marktplatz 5", city: "München", postalCode: "80331", countryCode: "DE" },
	},
	paymentMeans: { typeCode: "58", payeeAccount: { iban: "DE89370400440532013000" } },
	lines: [
		{
			lineId: "1",
			product: { name: "Beratung" },
			quantity: 10,
			unitCode: "HUR", // hours (UN/ECE Rec 20)
			netPrice: 90,
			lineTotalAmount: 900,
			taxCategoryCode: "S", // standard rate
			taxRate: 19,
		},
	],
	totals: {
		lineTotalAmount: 900,
		taxBasisTotalAmount: 900,
		taxTotalAmount: 171,
		grandTotalAmount: 1071,
		duePayableAmount: 1071,
	},
	taxBreakdown: [{ basisAmount: 900, calculatedAmount: 171, categoryCode: "S", ratePercent: 19 }],
};

const basePdf = new Uint8Array(await readFile("./invoice.pdf"));
const result = await generateZugferd(invoice, basePdf);

if (result.validationErrors.length > 0) {
	throw new Error(result.validationErrors.map((e) => `${e.ruleId}: ${e.message}`).join("\n"));
}

await writeFile("./invoice-zugferd.pdf", result.pdfBuffer);
```

Need only the XML (no PDF)? Use `generateXml(invoice)` — it validates and throws a
`ZugferdError` on failure, otherwise returns the CII XML string.

## Real-world mapping example

In a real app your invoice data lives in a database with its own shape, not in
`ZugferdInvoice` form. The recommended pattern is a small **adapter** that maps your domain
model to `ZugferdInvoice`. Below is a framework-agnostic version of the adapter used in
production by [Meyster](https://github.com/LukaHarambasic) (German trade-business invoicing),
showing the German specifics you typically need: tax-category mapping, §13b / §19 exemption
reasons, unit-code resolution and `380`/`381` type codes.

```ts
import {
	generateZugferd,
	roundAmount,
	type InvoiceLine,
	type MonetarySummation,
	type PaymentMeans,
	type TaxBreakdown,
	type TradeParty,
	type ZugferdInvoice,
} from "zugferd-ts";

// --- your domain model (whatever your DB returns) ---
interface Company { name: string; address: string; city: string; postalCode: string; countryCode: string; vatNumber?: string; taxNumber?: string; iban?: string; bic?: string; email?: string; phone?: string }
interface Customer { name: string; address: string; city: string; postalCode: string; countryCode: string; vatNumber?: string; contactPerson?: string; email?: string }
interface LineItem { title: string; description?: string; quantity: number; unit: string; unitPrice: number; totalPrice: number }
interface Invoice { number: string; date: string; currency: string; taxCategory: "standard" | "reverse_charge_13b" | "kleinunternehmer"; taxRate: number; isCancellation?: boolean }

// YYYY-MM-DD -> YYYYMMDD
const fmtDate = (iso: string): string => iso.replace(/-/g, "").slice(0, 8);

// German tax categories -> EN 16931 category codes
const taxCategoryCode = (c: Invoice["taxCategory"]): string =>
	c === "standard" ? "S" : c === "reverse_charge_13b" ? "AE" : "E";

// legally required exemption reason text for reverse-charge / small-business
const exemptionReason = (code: string): string | undefined =>
	code === "AE"
		? "Steuerschuldnerschaft des Leistungsempfängers nach §13b UStG"
		: code === "E"
			? "Umsatzsteuerbefreiung nach §19 UStG (Kleinunternehmerregelung)"
			: undefined;

// map your unit strings to UN/ECE Rec 20 codes; fall back to C62 (piece)
const unitCode = (unit: string, map: Map<string, string>): string => map.get(unit) ?? "C62";

const buildSeller = (c: Company): TradeParty => ({
	name: c.name,
	address: { lineOne: c.address, city: c.city, postalCode: c.postalCode, countryCode: c.countryCode },
	taxRegistrations: [
		...(c.vatNumber ? [{ id: c.vatNumber, schemeId: "VA" }] : []),
		...(c.taxNumber ? [{ id: c.taxNumber, schemeId: "FC" }] : []),
	],
	contact: { email: c.email, phone: c.phone },
});

const buildBuyer = (c: Customer): TradeParty => ({
	name: c.name,
	address: { lineOne: c.address, city: c.city, postalCode: c.postalCode, countryCode: c.countryCode },
	taxRegistrations: c.vatNumber ? [{ id: c.vatNumber, schemeId: "VA" }] : undefined,
	contact: { name: c.contactPerson, email: c.email },
});

const buildPaymentMeans = (c: Company): PaymentMeans => ({
	typeCode: "58", // SEPA credit transfer
	payeeAccount: c.iban ? { iban: c.iban, bic: c.bic } : undefined,
});

const buildLines = (items: LineItem[], code: string, rate: number, units: Map<string, string>): InvoiceLine[] =>
	items.map((item, i) => ({
		lineId: String(i + 1),
		product: { name: item.title || "Position", description: item.description },
		quantity: item.quantity,
		unitCode: unitCode(item.unit, units),
		netPrice: item.unitPrice,
		lineTotalAmount: item.totalPrice,
		taxCategoryCode: code,
		taxRate: code === "S" ? rate : 0,
		exemptionReason: exemptionReason(code),
	}));

const buildTotals = (net: number, rate: number): MonetarySummation => {
	const tax = roundAmount(net * (rate / 100), 2);
	const gross = roundAmount(net + tax, 2);
	return { lineTotalAmount: net, taxBasisTotalAmount: net, taxTotalAmount: tax, grandTotalAmount: gross, duePayableAmount: gross };
};

const buildTaxBreakdown = (net: number, code: string, rate: number): TaxBreakdown[] => [
	{ basisAmount: net, calculatedAmount: roundAmount(net * (rate / 100), 2), categoryCode: code, ratePercent: rate, exemptionReason: exemptionReason(code) },
];

export function mapToZugferdInvoice(
	invoice: Invoice,
	company: Company,
	customer: Customer,
	items: LineItem[],
	unitMap: Map<string, string>,
): ZugferdInvoice {
	const code = taxCategoryCode(invoice.taxCategory);
	const effectiveRate = code === "S" ? invoice.taxRate : 0;
	const net = roundAmount(items.reduce((s, it) => s + it.totalPrice, 0), 2);

	return {
		invoiceNumber: invoice.number,
		typeCode: invoice.isCancellation ? "381" : "380",
		issueDate: fmtDate(invoice.date),
		currency: invoice.currency,
		seller: buildSeller(company),
		buyer: buildBuyer(customer),
		paymentMeans: buildPaymentMeans(company),
		lines: buildLines(items, code, invoice.taxRate, unitMap),
		totals: buildTotals(net, effectiveRate),
		taxBreakdown: buildTaxBreakdown(net, code, effectiveRate),
	};
}

// then:
const zugferdInvoice = mapToZugferdInvoice(invoice, company, customer, items, unitMap);
const { pdfBuffer, validationErrors } = await generateZugferd(zugferdInvoice, basePdf);
```

## API

| Export | Description |
| --- | --- |
| `generateZugferd(invoice, pdfBuffer)` | Validates, generates CII XML, embeds it into the PDF/A-3. Returns `{ xml, pdfBuffer, validationErrors }`. On validation failure returns empty buffers + the errors (does not throw). |
| `generateXml(invoice)` | Validates and returns the CII XML string. Throws `ZugferdError` if validation fails. |
| `validateInvoice(invoice)` | Runs the full EN 16931 rule set. Returns `{ valid, errors }` (`ValidationResult`). |
| `roundAmount(value, decimals)` | Commercial rounding helper used for monetary amounts. |
| `ZugferdError` | Error thrown by `generateXml` / on XML-generation failure; carries `.cause`. |

All input/output types are exported (`ZugferdInvoice`, `TradeParty`, `InvoiceLine`,
`Product`, `MonetarySummation`, `TaxBreakdown`, `PaymentMeans`, `ValidationError`, …).

## Validation

`generateZugferd` and `generateXml` always validate first. Rules implemented cover the
EN 16931 business-rule families: mandatory fields, UN/CEFACT & ISO code lists, value
formats, the VAT-category rules (`BR-S`, `BR-AE`, `BR-E`, `BR-IC`, `BR-G`, `BR-O`, `BR-Z`,
`BR-FX-EN-04`), cross-field consistency checks and decimal/arithmetic checks. Each
`ValidationError` carries a `ruleId`, `message` and `severity`.

## Development

```bash
bun install
bun run test        # vitest
bun run typecheck   # tsc --noEmit
bun run lint        # biome
bun run build       # tsdown -> dist/ (ESM + CJS + d.ts)
```

## Releasing

Versioning and publishing use [Changesets](https://github.com/changesets/changesets) +
GitHub Actions:

1. Make your change on a branch, then `bunx changeset` and pick the bump (patch/minor/major)
   with a one-line summary. Commit the generated file in `.changeset/`.
2. Open a PR. CI runs lint, typecheck, tests and build. Merge to `main`.
3. The release workflow opens a **"Version Packages"** PR that bumps the version and updates
   `CHANGELOG.md`. Merging it publishes the new version to npm automatically.

Requires an `NPM_TOKEN` secret in the GitHub repo settings.

## License

[MIT](./LICENSE) © Luka Harambasic
