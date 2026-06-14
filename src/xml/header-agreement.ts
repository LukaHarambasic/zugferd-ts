import type { XMLBuilder } from "xmlbuilder2/lib/interfaces";
import type { ZugferdInvoice } from "../types/index";
import { uint8ToBase64 } from "../utils/base64";
import { NS } from "./namespaces";
import { buildTradeParty } from "./trade-party";

export function buildHeaderTradeAgreement(
	parent: XMLBuilder,
	invoice: ZugferdInvoice,
): void {
	const el = parent.ele(NS.RAM, "ram:ApplicableHeaderTradeAgreement");

	if (invoice.buyerReference) {
		el.ele(NS.RAM, "ram:BuyerReference").txt(invoice.buyerReference).up();
	}

	buildTradeParty(el, invoice.seller, "ram:SellerTradeParty");
	buildTradeParty(el, invoice.buyer, "ram:BuyerTradeParty");

	if (invoice.sellerTaxRepresentative) {
		buildTradeParty(
			el,
			{
				name: invoice.sellerTaxRepresentative.name,
				address: invoice.sellerTaxRepresentative.address,
				taxRegistrations: [
					{
						id: invoice.sellerTaxRepresentative.vatId,
						schemeId: "VA",
					},
				],
			},
			"ram:SellerTaxRepresentativeTradeParty",
		);
	}

	if (invoice.invoicee) {
		buildTradeParty(el, invoice.invoicee, "ram:ProductEndUserTradeParty");
	}

	if (invoice.salesOrderReference) {
		const docEl = el.ele(NS.RAM, "ram:SellerOrderReferencedDocument");
		docEl
			.ele(NS.RAM, "ram:IssuerAssignedID")
			.txt(invoice.salesOrderReference)
			.up();
		docEl.up();
	}

	if (invoice.purchaseOrderReference) {
		const docEl = el.ele(NS.RAM, "ram:BuyerOrderReferencedDocument");
		docEl
			.ele(NS.RAM, "ram:IssuerAssignedID")
			.txt(invoice.purchaseOrderReference)
			.up();
		docEl.up();
	}

	if (invoice.contractReference) {
		const docEl = el.ele(NS.RAM, "ram:ContractReferencedDocument");
		docEl
			.ele(NS.RAM, "ram:IssuerAssignedID")
			.txt(invoice.contractReference)
			.up();
		docEl.up();
	}

	if (invoice.tenderReference) {
		const docEl = el.ele(NS.RAM, "ram:AdditionalReferencedDocument");
		docEl.ele(NS.RAM, "ram:IssuerAssignedID").txt(invoice.tenderReference).up();
		docEl.ele(NS.RAM, "ram:TypeCode").txt("50").up();
		docEl.up();
	}

	if (invoice.invoicedObjectIdentifier) {
		const docEl = el.ele(NS.RAM, "ram:AdditionalReferencedDocument");
		const idEl = docEl.ele(NS.RAM, "ram:IssuerAssignedID");
		if (invoice.invoicedObjectIdentifier.schemeId) {
			idEl.att(null, "schemeID", invoice.invoicedObjectIdentifier.schemeId);
		}
		idEl.txt(invoice.invoicedObjectIdentifier.id).up();
		docEl.ele(NS.RAM, "ram:TypeCode").txt("130").up();
		docEl.up();
	}

	if (invoice.supportingDocuments) {
		for (const doc of invoice.supportingDocuments) {
			const docEl = el.ele(NS.RAM, "ram:AdditionalReferencedDocument");
			docEl.ele(NS.RAM, "ram:IssuerAssignedID").txt(doc.id).up();
			docEl.ele(NS.RAM, "ram:TypeCode").txt("916").up();
			if (doc.description) {
				docEl.ele(NS.RAM, "ram:Name").txt(doc.description).up();
			}
			if (doc.content && doc.mimeCode && doc.filename) {
				const binEl = docEl.ele(NS.RAM, "ram:AttachmentBinaryObject");
				binEl.att(null, "mimeCode", doc.mimeCode);
				binEl.att(null, "filename", doc.filename);
				binEl.txt(uint8ToBase64(doc.content)).up();
			}
			if (doc.uri) {
				docEl.ele(NS.RAM, "ram:URIID").txt(doc.uri).up();
			}
			docEl.up();
		}
	}

	if (invoice.projectReference) {
		const projEl = el.ele(NS.RAM, "ram:SpecifiedProcuringProject");
		projEl.ele(NS.RAM, "ram:ID").txt(invoice.projectReference).up();
		projEl
			.ele(NS.RAM, "ram:Name")
			.txt(invoice.projectName ?? "")
			.up();
		projEl.up();
	}

	el.up();
}
