import { create } from "xmlbuilder2";
import type { XMLBuilder } from "xmlbuilder2/lib/interfaces";
import { NS } from "./namespaces";

const NS_XS = "http://www.w3.org/2001/XMLSchema";

export type { XMLBuilder };

export function createCiiDocument(): XMLBuilder {
	const doc = create({ version: "1.0", encoding: "UTF-8" });

	const root = doc.ele(NS.RSM, "rsm:CrossIndustryInvoice");
	root.att(null, "xmlns:rsm", NS.RSM);
	root.att(null, "xmlns:ram", NS.RAM);
	root.att(null, "xmlns:qdt", NS.QDT);
	root.att(null, "xmlns:udt", NS.UDT);
	root.att(null, "xmlns:a", NS.QDT);
	root.att(null, "xmlns:xs", NS_XS);

	return root;
}

export function serializeXml(root: XMLBuilder): string {
	return root.doc().end({ prettyPrint: true, indent: "\t" });
}
