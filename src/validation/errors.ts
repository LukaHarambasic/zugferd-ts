export type ValidationSeverity = "error" | "warning";

export interface ValidationError {
	ruleId: string;
	path: string;
	message: string;
	severity: ValidationSeverity;
}

export interface ValidationResult {
	valid: boolean;
	errors: ValidationError[];
	warnings: ValidationError[];
}
