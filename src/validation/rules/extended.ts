import type { ZugferdInvoice } from "../../types/invoice";
import type { InvoiceLine } from "../../types/product";
import { withinTolerance } from "../../utils/decimal";
import type { ValidationError } from "../errors";

function err(ruleId: string, path: string, message: string): ValidationError {
	return { ruleId, path, message, severity: "error" };
}

export function validateExtended(invoice: ZugferdInvoice): ValidationError[] {
	const hasHierarchy = invoice.lines.some(
		(l) => l.parentLineId !== undefined || l.lineStatusCode !== undefined,
	);
	if (!hasHierarchy) return [];

	const lineById = new Map<string, InvoiceLine>();
	for (const line of invoice.lines) {
		lineById.set(line.lineId, line);
	}

	const childrenByParentId = new Map<string, InvoiceLine[]>();
	for (const line of invoice.lines) {
		if (line.parentLineId !== undefined) {
			const siblings = childrenByParentId.get(line.parentLineId) ?? [];
			siblings.push(line);
			childrenByParentId.set(line.parentLineId, siblings);
		}
	}

	const errors: ValidationError[] = [];

	for (const line of invoice.lines) {
		if (line.parentLineId !== undefined && !lineById.has(line.parentLineId)) {
			errors.push(
				err(
					"BR-FXEXT-11",
					`invoice.lines[${line.lineId}].parentLineId`,
					`Line ${line.lineId} references non-existent parentLineId "${line.parentLineId}"`,
				),
			);
		}
	}

	for (const line of invoice.lines) {
		const isChild = line.parentLineId !== undefined;
		const isParent = childrenByParentId.has(line.lineId);
		if ((isChild || isParent) && line.lineStatusCode === undefined) {
			errors.push(
				err(
					"BR-FXEXT-06",
					`invoice.lines[${line.lineId}].lineStatusCode`,
					`Line ${line.lineId} participates in a hierarchy but has no lineStatusCode (isChild=${isChild}, isParent=${isParent})`,
				),
			);
		}
	}

	for (const line of invoice.lines) {
		if (line.lineStatusCode === "GROUP") {
			const children = childrenByParentId.get(line.lineId) ?? [];
			const childSum = children.reduce(
				(acc, c) => acc + (c.lineTotalAmount ?? 0),
				0,
			);
			const stated = line.lineTotalAmount ?? 0;
			if (!withinTolerance(childSum, stated, children.length)) {
				errors.push(
					err(
						"BR-FXEXT-08",
						`invoice.lines[${line.lineId}].lineTotalAmount`,
						`GROUP line ${line.lineId} lineTotalAmount ${stated} does not match sum of children ${childSum} (${children.length} children)`,
					),
				);
			}
		}
	}

	for (const line of invoice.lines) {
		if (line.lineStatusCode === "DETAIL") {
			if (!Number.isFinite(line.quantity)) {
				errors.push(
					err(
						"BR-FXEXT-BR-22",
						`invoice.lines[${line.lineId}].quantity`,
						`DETAIL line ${line.lineId} must have a finite quantity (BT-129), got ${line.quantity}`,
					),
				);
			}
			if (!line.unitCode || line.unitCode.trim() === "") {
				errors.push(
					err(
						"BR-FXEXT-BR-23",
						`invoice.lines[${line.lineId}].unitCode`,
						`DETAIL line ${line.lineId} must have a unitCode (BT-130)`,
					),
				);
			}
			if (!Number.isFinite(line.netPrice)) {
				errors.push(
					err(
						"BR-FXEXT-BR-26",
						`invoice.lines[${line.lineId}].netPrice`,
						`DETAIL line ${line.lineId} must have a netPrice (BT-146), got ${line.netPrice}`,
					),
				);
			}
			if (Number.isFinite(line.netPrice) && line.netPrice < 0) {
				errors.push(
					err(
						"BR-FXEXT-BR-27",
						`invoice.lines[${line.lineId}].netPrice`,
						`DETAIL line ${line.lineId} netPrice must be >= 0, got ${line.netPrice}`,
					),
				);
			}
			if (!line.taxCategoryCode || line.taxCategoryCode.trim() === "") {
				errors.push(
					err(
						"BR-FXEXT-CO-04",
						`invoice.lines[${line.lineId}].taxCategoryCode`,
						`DETAIL line ${line.lineId} must have a taxCategoryCode (BT-151)`,
					),
				);
			}
		}
	}

	for (const line of invoice.lines) {
		if (line.lineStatusCode === "GROUP") {
			const children = childrenByParentId.get(line.lineId) ?? [];
			const n = children.length;
			const childSum = children.reduce(
				(acc, c) => acc + (c.lineTotalAmount ?? 0),
				0,
			);
			const stated = line.lineTotalAmount ?? 0;
			if (Math.abs(stated - childSum) > 0.01 * n) {
				errors.push(
					err(
						"BR-FXEXT-CO-10",
						`invoice.lines[${line.lineId}].lineTotalAmount`,
						`GROUP line ${line.lineId}: |${stated} - ${childSum}| > 0.01 × ${n}`,
					),
				);
			}
		}
	}

	return errors;
}
