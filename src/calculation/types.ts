export interface LineCalculationResult {
	lineId: string;
	grossPricePerUnit: number;
	netPricePerUnit: number;
	lineSubtotal: number;
	itemAllowancesTotal: number;
	itemChargesTotal: number;
	lineTotalAmount: number;
	taxCategoryCode: string;
	taxRate: number | undefined;
	isCalculationRelevant: boolean;
}
