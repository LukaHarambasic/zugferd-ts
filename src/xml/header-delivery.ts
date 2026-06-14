import type { XMLBuilder } from "xmlbuilder2/lib/interfaces";
import type { ZugferdInvoice } from "../types/index";
import { NS } from "./namespaces";
import { buildTradeParty } from "./trade-party";

export function buildHeaderTradeDelivery(
	parent: XMLBuilder,
	invoice: ZugferdInvoice,
): void {
	const el = parent.ele(NS.RAM, "ram:ApplicableHeaderTradeDelivery");

	if (invoice.shipTo) {
		buildTradeParty(el, invoice.shipTo, "ram:ShipToTradeParty");
	}

	if (invoice.deliveryDate) {
		const eventEl = el.ele(NS.RAM, "ram:ActualDeliverySupplyChainEvent");
		const dtEl = eventEl.ele(NS.RAM, "ram:OccurrenceDateTime");
		dtEl
			.ele(NS.UDT, "udt:DateTimeString")
			.att(null, "format", "102")
			.txt(invoice.deliveryDate)
			.up();
		dtEl.up();
		eventEl.up();
	}

	if (invoice.despatchAdviceReference) {
		const docEl = el.ele(NS.RAM, "ram:DespatchAdviceReferencedDocument");
		docEl
			.ele(NS.RAM, "ram:IssuerAssignedID")
			.txt(invoice.despatchAdviceReference)
			.up();
		docEl.up();
	}

	if (invoice.receivingAdviceReference) {
		const docEl = el.ele(NS.RAM, "ram:ReceivingAdviceReferencedDocument");
		docEl
			.ele(NS.RAM, "ram:IssuerAssignedID")
			.txt(invoice.receivingAdviceReference)
			.up();
		docEl.up();
	}

	el.up();
}
