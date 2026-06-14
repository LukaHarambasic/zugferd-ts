import type { ZugferdInvoice } from "../types";
import type { ValidationError, ValidationResult } from "./errors";
import { calculationRules } from "./rules/calculation";
import { mandatoryRules } from "./rules/mandatory";

export type ValidationRule = (invoice: ZugferdInvoice) => ValidationError[];

export function validate(
	invoice: ZugferdInvoice,
	rules: ValidationRule[],
): ValidationResult {
	const allErrors: ValidationError[] = [];
	for (const rule of rules) {
		allErrors.push(...rule(invoice));
	}
	const errors = allErrors.filter((e) => e.severity === "error");
	const warnings = allErrors.filter((e) => e.severity === "warning");
	return { valid: errors.length === 0, errors, warnings };
}

export function getAllRules(): ValidationRule[] {
	return [...mandatoryRules, ...calculationRules];
}
