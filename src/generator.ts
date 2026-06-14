import type { TransactionCalculationResult } from "./calculation/transaction-calculator";
import { calculateTransaction } from "./calculation/transaction-calculator";
import type { ZugferdInvoice } from "./types";
import { createCiiDocument, serializeXml } from "./xml/builder";
import { buildExchangedDocumentContext } from "./xml/context";
import { buildExchangedDocument } from "./xml/document";
import { buildHeaderTradeAgreement } from "./xml/header-agreement";
import { buildHeaderTradeDelivery } from "./xml/header-delivery";
import { buildHeaderTradeSettlement } from "./xml/header-settlement";
import { buildLineItems } from "./xml/line-item";
import { NS } from "./xml/namespaces";

export interface GeneratorResult {
	xml: string;
	calcResult: TransactionCalculationResult;
}

export function generateCiiXml(invoice: ZugferdInvoice): GeneratorResult {
	const calcResult = calculateTransaction(invoice);

	const root = createCiiDocument();
	buildExchangedDocumentContext(root, invoice.businessProcessId);
	buildExchangedDocument(root, invoice);

	const transaction = root.ele(NS.RAM, "ram:SupplyChainTradeTransaction");
	buildLineItems(transaction, invoice.lines, calcResult.lineResults);
	buildHeaderTradeAgreement(transaction, invoice);
	buildHeaderTradeDelivery(transaction, invoice);
	buildHeaderTradeSettlement(transaction, invoice, calcResult);

	return { xml: serializeXml(root), calcResult };
}
