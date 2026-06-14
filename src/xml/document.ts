import type { ZugferdInvoice } from "../types/index";
import type { XMLBuilder } from "./builder";
import { NS } from "./namespaces";

export function buildExchangedDocument(
	parent: XMLBuilder,
	invoice: ZugferdInvoice,
): void {
	const docEl = parent.ele(NS.RSM, "rsm:ExchangedDocument");

	docEl.ele(NS.RAM, "ram:ID").txt(invoice.invoiceNumber).up();
	docEl.ele(NS.RAM, "ram:TypeCode").txt(invoice.typeCode).up();

	const dateTimeEl = docEl.ele(NS.RAM, "ram:IssueDateTime");
	dateTimeEl
		.ele(NS.UDT, "udt:DateTimeString")
		.att(null, "format", "102")
		.txt(invoice.issueDate)
		.up();
	dateTimeEl.up();

	if (invoice.notes && invoice.notes.length > 0) {
		for (const note of invoice.notes) {
			const noteEl = docEl.ele(NS.RAM, "ram:IncludedNote");
			noteEl.ele(NS.RAM, "ram:Content").txt(note.content).up();
			if (note.subjectCode !== undefined) {
				noteEl.ele(NS.RAM, "ram:SubjectCode").txt(note.subjectCode).up();
			}
			if (note.contentCode !== undefined) {
				noteEl.ele(NS.RAM, "ram:ContentCode").txt(note.contentCode).up();
			}
			noteEl.up();
		}
	}

	if (invoice.testIndicator === true) {
		const indicatorEl = docEl.ele(NS.RAM, "ram:TestIndicator");
		indicatorEl.ele(NS.UDT, "udt:Indicator").txt("true").up();
		indicatorEl.up();
	}

	docEl.up();
}
