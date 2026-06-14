import type { LineCalculationResult } from "../calculation/types";
import type { InvoiceLine, LineAllowance, LineCharge } from "../types/product";
import {
	formatAmount,
	formatPercent,
	formatPrice,
	formatQuantity,
} from "../utils/decimal";
import type { XMLBuilder } from "./builder";
import { NS } from "./namespaces";

export function buildLineItems(
	parent: XMLBuilder,
	lines: InvoiceLine[],
	lineResults: LineCalculationResult[],
): void {
	for (let i = 0; i < lines.length; i++) {
		buildLineItem(parent, lines[i], lineResults[i]);
	}
}

export function buildLineItem(
	parent: XMLBuilder,
	line: InvoiceLine,
	calcResult: LineCalculationResult,
): void {
	const lineItem = parent.ele(NS.RAM, "ram:IncludedSupplyChainTradeLineItem");

	buildAssociatedDocumentLineDocument(lineItem, line);
	buildSpecifiedTradeProduct(lineItem, line);
	buildSpecifiedLineTradeAgreement(lineItem, line, calcResult);
	buildSpecifiedLineTradeDelivery(lineItem, line);
	buildSpecifiedLineTradeSettlement(lineItem, line, calcResult);

	lineItem.up();
}

function buildAssociatedDocumentLineDocument(
	parent: XMLBuilder,
	line: InvoiceLine,
): void {
	const docLine = parent.ele(NS.RAM, "ram:AssociatedDocumentLineDocument");

	docLine.ele(NS.RAM, "ram:LineID").txt(line.lineId).up();

	if (line.parentLineId) {
		docLine.ele(NS.RAM, "ram:ParentLineID").txt(line.parentLineId).up();
	}

	if (line.lineStatusCode) {
		docLine.ele(NS.RAM, "ram:LineStatusCode").txt("DETAIL").up();
		docLine
			.ele(NS.RAM, "ram:LineStatusReasonCode")
			.txt(line.lineStatusCode)
			.up();
	}

	if (line.notes && line.notes.length > 0) {
		for (const note of line.notes) {
			const noteEl = docLine.ele(NS.RAM, "ram:IncludedNote");
			noteEl.ele(NS.RAM, "ram:Content").txt(note.content).up();
			if (note.subjectCode) {
				noteEl.ele(NS.RAM, "ram:SubjectCode").txt(note.subjectCode).up();
			}
			noteEl.up();
		}
	}

	docLine.up();
}

function buildSpecifiedTradeProduct(
	parent: XMLBuilder,
	line: InvoiceLine,
): void {
	const product = line.product;
	const productEl = parent.ele(NS.RAM, "ram:SpecifiedTradeProduct");

	if (product.globalId) {
		const globalIdEl = productEl
			.ele(NS.RAM, "ram:GlobalID")
			.txt(product.globalId.id);
		if (product.globalId.schemeId) {
			globalIdEl.att(null, "schemeID", product.globalId.schemeId);
		}
		globalIdEl.up();
	}

	if (product.sellerAssignedId) {
		productEl
			.ele(NS.RAM, "ram:SellerAssignedID")
			.txt(product.sellerAssignedId)
			.up();
	}

	if (product.buyerAssignedId) {
		productEl
			.ele(NS.RAM, "ram:BuyerAssignedID")
			.txt(product.buyerAssignedId)
			.up();
	}

	productEl.ele(NS.RAM, "ram:Name").txt(product.name).up();

	if (product.description) {
		productEl.ele(NS.RAM, "ram:Description").txt(product.description).up();
	}

	if (product.attributes && product.attributes.length > 0) {
		for (const attr of product.attributes) {
			const attrEl = productEl.ele(
				NS.RAM,
				"ram:ApplicableProductCharacteristic",
			);
			attrEl.ele(NS.RAM, "ram:Description").txt(attr.name).up();
			attrEl.ele(NS.RAM, "ram:Value").txt(attr.value).up();
			attrEl.up();
		}
	}

	if (product.classifications && product.classifications.length > 0) {
		for (const cls of product.classifications) {
			const clsEl = productEl.ele(
				NS.RAM,
				"ram:DesignatedProductClassification",
			);
			const classCodeEl = clsEl
				.ele(NS.RAM, "ram:ClassCode")
				.txt(cls.classCode)
				.att(null, "listID", cls.listId);
			if (cls.listVersionId) {
				classCodeEl.att(null, "listVersionID", cls.listVersionId);
			}
			classCodeEl.up();
			if (cls.className) {
				clsEl.ele(NS.RAM, "ram:ClassName").txt(cls.className).up();
			}
			clsEl.up();
		}
	}

	if (product.countryOfOrigin) {
		const countryEl = productEl.ele(NS.RAM, "ram:OriginTradeCountry");
		countryEl.ele(NS.RAM, "ram:ID").txt(product.countryOfOrigin).up();
		countryEl.up();
	}

	productEl.up();
}

function buildSpecifiedLineTradeAgreement(
	parent: XMLBuilder,
	line: InvoiceLine,
	calcResult: LineCalculationResult,
): void {
	const agreement = parent.ele(NS.RAM, "ram:SpecifiedLineTradeAgreement");

	if (line.grossPrice) {
		const grossPriceEl = agreement.ele(
			NS.RAM,
			"ram:GrossPriceProductTradePrice",
		);
		grossPriceEl
			.ele(NS.RAM, "ram:ChargeAmount")
			.txt(formatPrice(line.grossPrice.amount))
			.up();

		if (line.grossPrice.basisQuantity !== undefined) {
			grossPriceEl
				.ele(NS.RAM, "ram:BasisQuantity")
				.att(null, "unitCode", line.unitCode)
				.txt(formatQuantity(line.grossPrice.basisQuantity))
				.up();
		}

		if (line.grossPrice.allowances && line.grossPrice.allowances.length > 0) {
			for (const allowance of line.grossPrice.allowances) {
				const allowanceEl = grossPriceEl.ele(
					NS.RAM,
					"ram:AppliedTradeAllowanceCharge",
				);
				const chargeIndicatorEl = allowanceEl.ele(
					NS.RAM,
					"ram:ChargeIndicator",
				);
				chargeIndicatorEl.ele(NS.UDT, "udt:Indicator").txt("false").up();
				chargeIndicatorEl.up();
				if (allowance.actualAmount !== undefined) {
					allowanceEl
						.ele(NS.RAM, "ram:ActualAmount")
						.txt(formatPrice(allowance.actualAmount))
						.up();
				}
				if (allowance.reason) {
					allowanceEl.ele(NS.RAM, "ram:Reason").txt(allowance.reason).up();
				}
				allowanceEl.up();
			}
		}

		grossPriceEl.up();
	}

	const netPriceEl = agreement.ele(NS.RAM, "ram:NetPriceProductTradePrice");
	netPriceEl
		.ele(NS.RAM, "ram:ChargeAmount")
		.txt(formatPrice(calcResult.netPricePerUnit))
		.up();

	if (line.netPriceBasisQuantity !== undefined) {
		netPriceEl
			.ele(NS.RAM, "ram:BasisQuantity")
			.att(null, "unitCode", line.unitCode)
			.txt(formatQuantity(line.netPriceBasisQuantity))
			.up();
	}

	netPriceEl.up();

	if (line.buyerOrderReference || line.buyerOrderLineReference) {
		const orderRefEl = agreement.ele(
			NS.RAM,
			"ram:BuyerOrderReferencedDocument",
		);
		if (line.buyerOrderReference) {
			orderRefEl
				.ele(NS.RAM, "ram:IssuerAssignedID")
				.txt(line.buyerOrderReference)
				.up();
		}
		if (line.buyerOrderLineReference) {
			orderRefEl
				.ele(NS.RAM, "ram:LineID")
				.txt(line.buyerOrderLineReference)
				.up();
		}
		orderRefEl.up();
	}

	agreement.up();
}

function buildSpecifiedLineTradeDelivery(
	parent: XMLBuilder,
	line: InvoiceLine,
): void {
	const delivery = parent.ele(NS.RAM, "ram:SpecifiedLineTradeDelivery");
	delivery
		.ele(NS.RAM, "ram:BilledQuantity")
		.att(null, "unitCode", line.unitCode)
		.txt(formatQuantity(line.quantity))
		.up();
	delivery.up();
}

function buildSpecifiedLineTradeSettlement(
	parent: XMLBuilder,
	line: InvoiceLine,
	calcResult: LineCalculationResult,
): void {
	const settlement = parent.ele(NS.RAM, "ram:SpecifiedLineTradeSettlement");

	const taxEl = settlement.ele(NS.RAM, "ram:ApplicableTradeTax");
	taxEl.ele(NS.RAM, "ram:TypeCode").txt("VAT").up();
	taxEl.ele(NS.RAM, "ram:CategoryCode").txt(line.taxCategoryCode).up();
	if (line.taxCategoryCode !== "O" && line.taxRate !== undefined) {
		taxEl
			.ele(NS.RAM, "ram:RateApplicablePercent")
			.txt(formatPercent(line.taxRate))
			.up();
	}
	taxEl.up();

	if (line.billingPeriod) {
		const periodEl = settlement.ele(NS.RAM, "ram:BillingSpecifiedPeriod");
		if (line.billingPeriod.startDate) {
			const startEl = periodEl.ele(NS.RAM, "ram:StartDateTime");
			startEl
				.ele(NS.UDT, "udt:DateTimeString")
				.att(null, "format", "102")
				.txt(line.billingPeriod.startDate)
				.up();
			startEl.up();
		}
		if (line.billingPeriod.endDate) {
			const endEl = periodEl.ele(NS.RAM, "ram:EndDateTime");
			endEl
				.ele(NS.UDT, "udt:DateTimeString")
				.att(null, "format", "102")
				.txt(line.billingPeriod.endDate)
				.up();
			endEl.up();
		}
		periodEl.up();
	}

	if (line.allowances && line.allowances.length > 0) {
		for (const allowance of line.allowances) {
			buildLineAllowanceCharge(settlement, allowance, false);
		}
	}

	if (line.charges && line.charges.length > 0) {
		for (const charge of line.charges) {
			buildLineAllowanceCharge(settlement, charge, true);
		}
	}

	const summation = settlement.ele(
		NS.RAM,
		"ram:SpecifiedTradeSettlementLineMonetarySummation",
	);
	summation
		.ele(NS.RAM, "ram:LineTotalAmount")
		.txt(formatAmount(calcResult.lineTotalAmount))
		.up();
	summation.up();

	if (line.accountingReference) {
		const accountEl = settlement.ele(
			NS.RAM,
			"ram:ReceivableSpecifiedTradeAccountingAccount",
		);
		accountEl.ele(NS.RAM, "ram:ID").txt(line.accountingReference).up();
		accountEl.up();
	}

	settlement.up();
}

function buildLineAllowanceCharge(
	parent: XMLBuilder,
	item: LineAllowance | LineCharge,
	isCharge: boolean,
): void {
	const el = parent.ele(NS.RAM, "ram:SpecifiedTradeAllowanceCharge");

	const chargeIndicatorEl = el.ele(NS.RAM, "ram:ChargeIndicator");
	chargeIndicatorEl
		.ele(NS.UDT, "udt:Indicator")
		.txt(isCharge ? "true" : "false")
		.up();
	chargeIndicatorEl.up();

	if (item.actualAmount !== undefined) {
		el.ele(NS.RAM, "ram:ActualAmount")
			.txt(formatAmount(item.actualAmount))
			.up();
	}

	if (item.basisAmount !== undefined) {
		el.ele(NS.RAM, "ram:BasisAmount").txt(formatAmount(item.basisAmount)).up();
	}

	if (item.calculationPercent !== undefined) {
		el.ele(NS.RAM, "ram:CalculationPercent")
			.txt(formatPercent(item.calculationPercent))
			.up();
	}

	if (item.reason) {
		el.ele(NS.RAM, "ram:Reason").txt(item.reason).up();
	}

	if (item.reasonCode) {
		el.ele(NS.RAM, "ram:ReasonCode").txt(item.reasonCode).up();
	}

	el.up();
}
