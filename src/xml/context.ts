import type { XMLBuilder } from "./builder";
import { EXTENDED_PROFILE_URI, NS } from "./namespaces";

export function buildExchangedDocumentContext(
	parent: XMLBuilder,
	businessProcessId?: string,
): void {
	const contextEl = parent.ele(NS.RSM, "rsm:ExchangedDocumentContext");

	if (businessProcessId !== undefined) {
		const bpEl = contextEl.ele(
			NS.RAM,
			"ram:BusinessProcessSpecifiedDocumentContextParameter",
		);
		bpEl.ele(NS.RAM, "ram:ID").txt(businessProcessId).up();
		bpEl.up();
	}

	const guidelineEl = contextEl.ele(
		NS.RAM,
		"ram:GuidelineSpecifiedDocumentContextParameter",
	);
	guidelineEl.ele(NS.RAM, "ram:ID").txt(EXTENDED_PROFILE_URI).up();
	guidelineEl.up();

	contextEl.up();
}
